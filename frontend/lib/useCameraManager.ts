'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  groupId?: string;
  isBuiltIn: boolean;
  isExternal: boolean;
}

export type CameraConnectionStatus =
  | 'idle'
  | 'connected'
  | 'switching'
  | 'fallback'
  | 'disconnected'
  | 'error';

export interface UseCameraManagerOptions {
  isMonitoring: boolean;
  onCameraSwitched?: (deviceId: string, label: string) => void;
  onFallbackOccurred?: (fromDeviceId: string, toDevice: CameraDeviceInfo | null) => void;
  onError?: (err: Error) => void;
}

/**
 * Categorize camera by label into built-in laptop camera vs external USB camera.
 */
export function classifyCamera(label: string): { isBuiltIn: boolean; isExternal: boolean } {
  const lower = (label || '').toLowerCase();
  
  // Common built-in webcam naming conventions
  const isBuiltIn = 
    lower.includes('integrated') ||
    lower.includes('built-in') ||
    lower.includes('internal') ||
    lower.includes('facetime') ||
    lower.includes('front') ||
    lower.includes('laptop') ||
    lower.includes('embedded');

  // Common external USB camera naming conventions (including user's AR WCA08)
  const isExternal =
    lower.includes('usb') ||
    lower.includes('wca08') ||
    lower.includes('ar wca08') ||
    lower.includes('external') ||
    lower.includes('uisebrt') ||
    lower.includes('logitech') ||
    lower.includes('c920') ||
    lower.includes('c922') ||
    (!isBuiltIn && lower.length > 0);

  return { isBuiltIn, isExternal };
}

/**
 * Format a human-readable camera label if the browser returns an empty string (before permission).
 */
export function formatCameraLabel(device: MediaDeviceInfo, index: number): string {
  if (device.label && device.label.trim().length > 0) {
    return device.label;
  }
  return `Camera ${index + 1}`;
}

export function useCameraManager({
  isMonitoring,
  onCameraSwitched,
  onFallbackOccurred,
  onError,
}: UseCameraManagerOptions) {
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [status, setStatus] = useState<CameraConnectionStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Sensors Standby');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('');
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);

  const onCameraSwitchedRef = useRef(onCameraSwitched);
  onCameraSwitchedRef.current = onCameraSwitched;
  const onFallbackOccurredRef = useRef(onFallbackOccurred);
  onFallbackOccurredRef.current = onFallbackOccurred;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const currentGenRef = useRef<number>(0);
  const selectedCameraIdRef = useRef<string>(selectedCameraId);
  selectedCameraIdRef.current = selectedCameraId;
  const isMonitoringRef = useRef<boolean>(isMonitoring);
  isMonitoringRef.current = isMonitoring;
  const devicesRef = useRef<CameraDeviceInfo[]>([]);
  devicesRef.current = devices;

  /**
   * Helper to stop all tracks on an active stream cleanly
   */
  const stopCurrentStream = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        try {
          track.stop();
        } catch {}
      });
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  /**
   * Enumerate all video input devices and classify them
   */
  const enumerateCameras = useCallback(async (): Promise<CameraDeviceInfo[]> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');

      const mapped: CameraDeviceInfo[] = videoInputs.map((d, index) => {
        const label = formatCameraLabel(d, index);
        const { isBuiltIn, isExternal } = classifyCamera(label);
        return {
          deviceId: d.deviceId,
          label,
          groupId: d.groupId,
          isBuiltIn,
          isExternal,
        };
      });

      setDevices(mapped);
      devicesRef.current = mapped;
      return mapped;
    } catch (err) {
      console.warn('[CameraManager] Device enumeration error:', err);
      return [];
    }
  }, []);

  /**
   * Automatic Fallback: pick the best remaining camera (preferring built-in)
   */
  const triggerAutoFallback = useCallback(
    async (fromDeviceId: string, currentDeviceList?: CameraDeviceInfo[]) => {
      console.warn(`[CameraManager] Triggering auto-fallback from device: ${fromDeviceId}`);
      setIsFallbackActive(true);
      setStatus('fallback');

      const remaining = currentDeviceList || (await enumerateCameras());
      // Filter out the failed/disconnected device
      const available = remaining.filter((d) => d.deviceId !== fromDeviceId);

      // Prioritize built-in camera for fallback stability
      let fallbackTarget = available.find((d) => d.isBuiltIn);
      if (!fallbackTarget && available.length > 0) {
        fallbackTarget = available[0];
      }

      const targetLabel = fallbackTarget?.label || 'Built-in Laptop Camera';
      setStatusMessage(`External camera disconnected • Auto-switched to ${targetLabel}`);

      if (fallbackTarget) {
        setSelectedCameraId(fallbackTarget.deviceId);
        if (onFallbackOccurredRef.current) {
          onFallbackOccurredRef.current(fromDeviceId, fallbackTarget);
        }
        await switchCamera(fallbackTarget.deviceId, true);
      } else {
        // Generic fallback without exact deviceId
        if (onFallbackOccurredRef.current) {
          onFallbackOccurredRef.current(fromDeviceId, null);
        }
        await switchCamera('', true);
      }
    },
    [enumerateCameras]
  );

  /**
   * Handle video track unexpectedly ending (e.g. physical USB disconnection)
   */
  const handleTrackEnded = useCallback(
    (endedDeviceId: string) => {
      console.warn(`[CameraManager] Active video track ended for device: ${endedDeviceId}`);
      if (isMonitoringRef.current) {
        // Trigger immediate re-enumeration and fallback
        enumerateCameras().then((updatedList) => {
          triggerAutoFallback(endedDeviceId, updatedList);
        });
      }
    },
    [enumerateCameras, triggerAutoFallback]
  );

  /**
   * Core function to start/switch the camera stream
   */
  const switchCamera = useCallback(
    async (targetDeviceId?: string, isFallback: boolean = false): Promise<boolean> => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setStatusMessage('MediaDevices API not supported in this browser');
        return false;
      }

      const gen = ++currentGenRef.current;
      setIsSwitching(true);
      setCameraError(null);

      if (!isFallback) {
        setStatus('switching');
        setStatusMessage('Acquiring optical feed...');
      }

      // Stop previous stream first to release the hardware lock cleanly
      stopCurrentStream();

      // Configure video constraints (never hardcode index 0 or 1!)
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

      if (targetDeviceId && targetDeviceId.length > 0) {
        videoConstraints.deviceId = { exact: targetDeviceId };
      } else {
        videoConstraints.facingMode = 'user';
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        // Prevent race condition if a newer switch was requested
        if (gen !== currentGenRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return false;
        }

        activeStreamRef.current = stream;

        if (videoRef.current) {
          if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
          }
          try {
            await videoRef.current.play();
          } catch (e: any) {
            // Ignore benign AbortError when play is superseded by consecutive loads
            if (e?.name !== 'AbortError') {
              console.warn('[CameraManager] video.play() error:', e);
            }
          }
        }

        const videoTrack = stream.getVideoTracks()[0];
        const trackSettings = videoTrack?.getSettings();
        const resolvedDeviceId = trackSettings?.deviceId || targetDeviceId || '';
        const trackLabel = videoTrack?.label || '';

        // Attach disconnection listener
        if (videoTrack) {
          videoTrack.onended = () => {
            handleTrackEnded(resolvedDeviceId);
          };
        }

        // Re-enumerate devices now that camera permission is granted (populates labels!)
        const updatedDevices = await enumerateCameras();
        const activeDev = updatedDevices.find((d) => d.deviceId === resolvedDeviceId);
        const displayName = activeDev?.label || trackLabel || 'Webcam';

        setActiveCameraLabel(displayName);
        setSelectedCameraId(resolvedDeviceId);
        setHasPermission(true);
        setIsSwitching(false);

        if (isFallback) {
          setStatus('fallback');
          setStatusMessage(`Active [Fallback]: ${displayName}`);
        } else {
          setIsFallbackActive(false);
          setStatus('connected');
          setStatusMessage(`Active: ${displayName}`);
        }

        if (onCameraSwitchedRef.current) {
          onCameraSwitchedRef.current(resolvedDeviceId, displayName);
        }

        return true;
      } catch (err: any) {
        console.warn(`[CameraManager] Failed to start stream (device: ${targetDeviceId}):`, err);

        // If target device failed and we weren't already falling back, try auto-fallback
        if (targetDeviceId && !isFallback && isMonitoringRef.current) {
          console.warn('[CameraManager] Target camera failed. Attempting fallback...');
          await triggerAutoFallback(targetDeviceId);
          return false;
        }

        setIsSwitching(false);
        setStatus('error');
        const errorMsg =
          err?.name === 'NotAllowedError'
            ? 'Camera access denied by user. Please allow camera permissions.'
            : err?.name === 'NotFoundError'
            ? 'Requested camera hardware not found or unplugged.'
            : err?.name === 'NotReadableError'
            ? 'Camera is currently in use by another application.'
            : err?.message || 'Camera acquisition failed.';

        setCameraError(errorMsg);
        setStatusMessage(errorMsg);
        setHasPermission(false);

        if (onErrorRef.current && err instanceof Error) {
          onErrorRef.current(err);
        }
        return false;
      }
    },
    [stopCurrentStream, handleTrackEnded, enumerateCameras, triggerAutoFallback]
  );

  /**
   * Listen for hardware USB connect / disconnect events via devicechange
   */
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.addEventListener) {
      return;
    }

    const handleDeviceChange = async () => {
      console.log('[CameraManager] Hardware devicechange event detected!');
      const newDevices = await enumerateCameras();

      // Check if new device connected
      const prevIds = new Set(devicesRef.current.map((d) => d.deviceId));
      const newlyAdded = newDevices.find((d) => !prevIds.has(d.deviceId));
      if (newlyAdded) {
        console.log(`[CameraManager] New camera connected: ${newlyAdded.label}`);
        setStatusMessage(`New camera connected: ${newlyAdded.label}`);
      }

      // Check if active camera was disconnected
      const activeId = selectedCameraIdRef.current;
      if (activeId && isMonitoringRef.current) {
        const stillPresent = newDevices.some((d) => d.deviceId === activeId);
        if (!stillPresent) {
          console.warn(`[CameraManager] Active camera ${activeId} was disconnected!`);
          triggerAutoFallback(activeId, newDevices);
        }
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateCameras, triggerAutoFallback]);

  /**
   * Initial enumeration on mount
   */
  useEffect(() => {
    enumerateCameras().then((devs) => {
      if (devs.length > 0 && !selectedCameraIdRef.current) {
        // Prefer external camera if already attached (e.g. AR WCA08), otherwise first device
        const externalCam = devs.find((d) => d.isExternal);
        const initial = externalCam || devs[0];
        setSelectedCameraId(initial.deviceId);
      }
    });
  }, [enumerateCameras]);

  /**
   * Manage stream start/stop when isMonitoring changes
   */
  useEffect(() => {
    if (isMonitoring) {
      switchCamera(selectedCameraIdRef.current || undefined);
    } else {
      stopCurrentStream();
      setStatus('idle');
      setStatusMessage('Sensors Standby');
      setIsSwitching(false);
      setIsFallbackActive(false);
    }

    return () => {
      stopCurrentStream();
    };
  }, [isMonitoring, stopCurrentStream, switchCamera]);

  /**
   * Manual camera switch triggered by user
   */
  const handleSelectCamera = useCallback(
    (deviceId: string) => {
      if (deviceId === selectedCameraIdRef.current && status === 'connected') {
        return;
      }
      setSelectedCameraId(deviceId);
      if (isMonitoringRef.current) {
        switchCamera(deviceId);
      } else {
        const target = devices.find((d) => d.deviceId === deviceId);
        if (target) {
          setActiveCameraLabel(target.label);
          setStatusMessage(`Selected: ${target.label}`);
        }
      }
    },
    [devices, status, switchCamera]
  );

  return {
    devices,
    selectedCameraId,
    status,
    statusMessage,
    hasPermission,
    cameraError,
    isSwitching,
    activeCameraLabel,
    isFallbackActive,
    videoRef,
    switchCamera: handleSelectCamera,
    refreshCameras: enumerateCameras,
  };
}
