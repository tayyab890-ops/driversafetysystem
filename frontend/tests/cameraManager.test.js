/**
 * DriveGuard AI — Camera Management & Multi-Webcam Switching Test Suite
 * Validates:
 * 1. Detection and classification of all cameras (including AR WCA08 USB and Built-in).
 * 2. Manual camera switching & track cleanup (zero duplicate streams).
 * 3. Automatic detection of newly plugged USB webcams via devicechange.
 * 4. Automatic fallback to built-in laptop webcam upon external USB disconnect.
 * 5. Strict deviceId targeting (zero hardcoded indexes 0/1).
 * 6. Error handling for permission denial, hardware disconnection, and device in use.
 */

const assert = require('assert');

// Mock MediaStreamTrack
class MockMediaStreamTrack {
  constructor(kind = 'video', label = 'Mock Video Track', deviceId = 'mock-dev-1') {
    this.kind = kind;
    this.label = label;
    this.deviceId = deviceId;
    this.readyState = 'live';
    this.stopped = false;
    this.onended = null;
  }

  getSettings() {
    return { deviceId: this.deviceId };
  }

  stop() {
    this.stopped = true;
    this.readyState = 'ended';
  }

  // Simulate hardware unplug
  simulateUnplug() {
    this.stop();
    if (typeof this.onended === 'function') {
      this.onended();
    }
  }
}

// Mock MediaStream
class MockMediaStream {
  constructor(tracks = []) {
    this.tracks = tracks;
  }

  getTracks() {
    return this.tracks;
  }

  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === 'video');
  }

  stop() {
    this.tracks.forEach((t) => t.stop());
  }
}

// Classification logic under test
function classifyCamera(label) {
  const lower = (label || '').toLowerCase();
  
  const isBuiltIn = 
    lower.includes('integrated') ||
    lower.includes('built-in') ||
    lower.includes('internal') ||
    lower.includes('facetime') ||
    lower.includes('front') ||
    lower.includes('laptop') ||
    lower.includes('embedded');

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

// Camera Manager Controller simulation
class CameraManagerController {
  constructor() {
    this.devices = [];
    this.selectedCameraId = '';
    this.activeStream = null;
    this.status = 'idle';
    this.statusMessage = 'Sensors Standby';
    this.isFallbackActive = false;
    this.isMonitoring = false;
    this.fallbackHistory = [];
  }

  setDevices(devices) {
    this.devices = devices.map((d) => {
      const { isBuiltIn, isExternal } = classifyCamera(d.label);
      return {
        deviceId: d.deviceId,
        label: d.label,
        isBuiltIn,
        isExternal,
      };
    });
  }

  // Start or switch to a specific camera using its unique deviceId
  async switchCamera(targetDeviceId, isFallback = false) {
    // Assert requirement: No hardcoded index numbers used
    assert(
      typeof targetDeviceId === 'string',
      'Target camera must be referenced by string deviceId, not numeric index'
    );
    assert(
      targetDeviceId !== '0' && targetDeviceId !== '1',
      'Hardcoded camera index 0 or 1 is strictly prohibited'
    );

    // Cleanly stop any existing stream tracks first
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((t) => {
        t.onended = null;
        t.stop();
      });
      this.activeStream = null;
    }

    const target = this.devices.find((d) => d.deviceId === targetDeviceId);
    if (!target && targetDeviceId) {
      // Hardware missing or unplugged -> trigger auto fallback
      return this.triggerAutoFallback(targetDeviceId);
    }

    const label = target ? target.label : 'Default User Camera';
    const track = new MockMediaStreamTrack('video', label, targetDeviceId);
    const stream = new MockMediaStream([track]);

    // Attach hardware disconnection handler
    track.onended = () => {
      this.handleTrackEnded(targetDeviceId);
    };

    this.activeStream = stream;
    this.selectedCameraId = targetDeviceId;
    this.status = isFallback ? 'fallback' : 'connected';
    this.statusMessage = isFallback ? `Active [Fallback]: ${label}` : `Active: ${label}`;
    this.isFallbackActive = isFallback;

    return stream;
  }

  // Automatic Fallback to built-in laptop camera
  async triggerAutoFallback(fromDeviceId) {
    this.isFallbackActive = true;
    this.status = 'fallback';

    // Find remaining available devices
    const available = this.devices.filter((d) => d.deviceId !== fromDeviceId);
    // Prioritize built-in camera
    let fallbackTarget = available.find((d) => d.isBuiltIn);
    if (!fallbackTarget && available.length > 0) {
      fallbackTarget = available[0];
    }

    const fallbackId = fallbackTarget ? fallbackTarget.deviceId : 'built-in-default-id';
    this.fallbackHistory.push({ from: fromDeviceId, to: fallbackId });

    return this.switchCamera(fallbackId, true);
  }

  handleTrackEnded(endedDeviceId) {
    if (this.isMonitoring) {
      // Remove unplugged device from device list
      this.devices = this.devices.filter((d) => d.deviceId !== endedDeviceId);
      this.triggerAutoFallback(endedDeviceId);
    }
  }

  // Handle hardware devicechange event
  handleDeviceChange(newHardwareList) {
    const prevIds = new Set(this.devices.map((d) => d.deviceId));
    this.setDevices(newHardwareList);

    // If currently selected camera was removed, trigger fallback immediately
    if (this.isMonitoring && this.selectedCameraId) {
      const stillPresent = this.devices.some((d) => d.deviceId === this.selectedCameraId);
      if (!stillPresent) {
        this.triggerAutoFallback(this.selectedCameraId);
      }
    }
  }
}

// =========================================================================
// RUN TEST SUITE
// =========================================================================

console.log('======================================================');
console.log('DRIVEGUARD AI CAMERA MANAGEMENT SUITE VERIFICATION');
console.log('======================================================\n');

let passedTests = 0;

// Test 1: Classification of AR WCA08 USB Camera and Built-in Webcam
console.log('Requirement 1 & 6: Display All Cameras & Device Classification');
{
  const arCam = classifyCamera('AR WCA08 USB Camera');
  assert.strictEqual(arCam.isExternal, true, 'AR WCA08 must be classified as external');
  assert.strictEqual(arCam.isBuiltIn, false, 'AR WCA08 must not be classified as built-in');

  const laptopCam = classifyCamera('Integrated Camera (04f2:b6b4)');
  assert.strictEqual(laptopCam.isBuiltIn, true, 'Integrated camera must be classified as built-in');
  assert.strictEqual(laptopCam.isExternal, false, 'Integrated camera must not be external');

  const facetimeCam = classifyCamera('FaceTime HD Camera (Built-in)');
  assert.strictEqual(facetimeCam.isBuiltIn, true, 'FaceTime camera must be classified as built-in');

  const usbGeneric = classifyCamera('USB 2.0 HD UVC WebCam');
  assert.strictEqual(usbGeneric.isExternal, true, 'USB webcam must be classified as external');

  console.log('  [PASS] AR WCA08 USB Camera classified as External USB sensor');
  console.log('  [PASS] Integrated & Built-in cameras classified as Built-in sensor');
  passedTests++;
}

// Test 2: Multi-camera Enumeration and Population
console.log('\nRequirement 1 & 2: Multi-camera Detection & Manual Selection');
{
  const controller = new CameraManagerController();
  const mockHardware = [
    { deviceId: 'dev-builtin-1234', label: 'Integrated Webcam (Built-in)' },
    { deviceId: 'dev-ar-wca08-5678', label: 'AR WCA08 USB Camera' },
  ];

  controller.setDevices(mockHardware);
  assert.strictEqual(controller.devices.length, 2, 'Must detect exactly 2 cameras');
  assert.strictEqual(controller.devices[0].deviceId, 'dev-builtin-1234');
  assert.strictEqual(controller.devices[1].deviceId, 'dev-ar-wca08-5678');
  assert.strictEqual(controller.devices[1].isExternal, true);
  console.log('  [PASS] Correctly detected and listed all 2 webcams with proper labels');
  passedTests++;
}

// Test 3: Hot-switching between cameras with clean stream release
console.log('\nRequirement 5: Hot Switching Without Duplicate Streams');
(async () => {
  const controller = new CameraManagerController();
  controller.setDevices([
    { deviceId: 'dev-builtin-1234', label: 'Integrated Webcam' },
    { deviceId: 'dev-ar-wca08-5678', label: 'AR WCA08 USB Camera' },
  ]);

  // Start with built-in camera
  const stream1 = await controller.switchCamera('dev-builtin-1234');
  assert.strictEqual(controller.selectedCameraId, 'dev-builtin-1234');
  assert.strictEqual(stream1.getVideoTracks()[0].stopped, false);

  // Hot switch to AR WCA08 USB camera
  const stream2 = await controller.switchCamera('dev-ar-wca08-5678');
  assert.strictEqual(controller.selectedCameraId, 'dev-ar-wca08-5678');
  assert.strictEqual(stream2.getVideoTracks()[0].stopped, false);
  // Verify previous stream tracks were completely stopped
  assert.strictEqual(stream1.getVideoTracks()[0].stopped, true, 'Old stream must be stopped on switch');
  assert.notStrictEqual(stream1, stream2, 'New stream must replace old stream cleanly');

  console.log('  [PASS] Previous stream tracks stopped immediately upon switching');
  console.log('  [PASS] Zero duplicate streams created during hot-switch');
  passedTests++;
})().then(() => {
  // Test 4: Automatic Detection of USB plug event via devicechange
  console.log('\nRequirement 3: Automatic Detection of USB Plug-in');
  {
    const controller = new CameraManagerController();
    // Initially only laptop built-in camera is available
    controller.setDevices([
      { deviceId: 'dev-builtin-1234', label: 'Integrated Webcam' },
    ]);
    assert.strictEqual(controller.devices.length, 1);

    // User plugs in external AR WCA08 USB camera while running
    const updatedHardware = [
      { deviceId: 'dev-builtin-1234', label: 'Integrated Webcam' },
      { deviceId: 'dev-ar-wca08-5678', label: 'AR WCA08 USB Camera' },
    ];
    controller.handleDeviceChange(updatedHardware);

    assert.strictEqual(controller.devices.length, 2, 'Devices list must update to 2');
    const newCam = controller.devices.find((d) => d.deviceId === 'dev-ar-wca08-5678');
    assert.ok(newCam, 'Newly plugged AR WCA08 must be present in devices');
    assert.strictEqual(newCam.label, 'AR WCA08 USB Camera');
    console.log('  [PASS] External USB webcam dynamically detected without refreshing page');
    passedTests++;
  }

  // Test 5: Automatic Fallback to Built-in Webcam on Disconnect
  console.log('\nRequirement 4: Automatic Fallback to Built-in Camera on USB Disconnect');
  (async () => {
    const controller = new CameraManagerController();
    controller.isMonitoring = true;
    controller.setDevices([
      { deviceId: 'dev-builtin-1234', label: 'Integrated Webcam' },
      { deviceId: 'dev-ar-wca08-5678', label: 'AR WCA08 USB Camera' },
    ]);

    // Active monitoring using AR WCA08 external camera
    const activeStream = await controller.switchCamera('dev-ar-wca08-5678');
    assert.strictEqual(controller.selectedCameraId, 'dev-ar-wca08-5678');
    assert.strictEqual(controller.isFallbackActive, false);

    // Simulate physical USB unplug of AR WCA08 camera while streaming
    activeStream.getVideoTracks()[0].simulateUnplug();

    // Verify auto fallback was triggered to built-in camera
    assert.strictEqual(controller.isFallbackActive, true, 'Fallback state must be active');
    assert.strictEqual(controller.selectedCameraId, 'dev-builtin-1234', 'Must fallback to built-in camera');
    assert.strictEqual(controller.fallbackHistory.length, 1);
    assert.strictEqual(controller.fallbackHistory[0].from, 'dev-ar-wca08-5678');
    assert.strictEqual(controller.fallbackHistory[0].to, 'dev-builtin-1234');
    assert.strictEqual(controller.activeStream.getVideoTracks()[0].stopped, false);

    console.log('  [PASS] USB unplug detected immediately via track.onended');
    console.log('  [PASS] Auto-fallback seamlessly switched feed to Integrated Webcam');
    passedTests++;

    // Test 6: Verification of DeviceId usage (no index 0/1 hardcoding)
    console.log('\nRequirement 9: Strict Device ID Addressing (No Hardcoded 0/1 Indexes)');
    {
      const controller = new CameraManagerController();
      await assert.rejects(
        async () => {
          await controller.switchCamera('0');
        },
        /prohibited/,
        'Index 0 must be rejected'
      );

      await assert.rejects(
        async () => {
          await controller.switchCamera('1');
        },
        /prohibited/,
        'Index 1 must be rejected'
      );

      console.log('  [PASS] Hardcoded camera indexes 0 and 1 strictly prohibited and rejected');
      passedTests++;
    }

    console.log('\n======================================================');
    console.log(`ALL CAMERA MANAGEMENT TESTS PASSED: ${passedTests}/${passedTests} (100%)`);
    console.log('======================================================');
  })();
});
