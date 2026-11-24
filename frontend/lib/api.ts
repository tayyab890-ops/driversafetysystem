/**
 * DriveGuard AI — Centralized REST API Client
 * Manages JWT tokens, automatic refresh, error handling, and API calls.
 * Security: Refresh tokens are stored in secure HttpOnly cookies (inaccessible to JS).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AuthTokens {
  accessToken: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'driver' | 'admin';
  vehicle_id?: string | null;
  avatar?: string | null;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
  user: ApiUser;
}

export interface DriverDashboardEvent {
  id: string;
  sessionId: string;
  sessionRef: string;
  timestamp: string;
  time: string;
  category: string;
  title: string;
  description: string;
  detail: string;
  severity: string;
  acknowledged: boolean;
  driverId: string;
  driverName: string;
  confidence: number;
  metrics: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any> | null;
}

export interface DriverDashboardSession {
  id: string;
  driverId: string;
  driverName: string;
  vehicle: string;
  startTime: string;
  endTime?: string | null;
  durationMinutes: number;
  status: string;
  safetyScore: number;
  alertCount: number;
  criticalAlerts: number;
  milesMonitored?: number;
}

export interface WeeklyScoreTrendPoint {
  day: string;
  date: string;
  score: number;
  sessions: number;
  hours: number;
  miles: number;
}

export interface HourlyFocusPoint {
  hour: string;
  ear: number;
  attention: number;
}

export interface AlertnessAnalysisCategory {
  category: string;
  count: number;
}

export interface DriverDashboardResponse {
  safetyScore: number;
  hasSessions: boolean;
  totalSessions: number;
  sessionsToday: number;
  totalSessionTime: number;
  milesProtected: number;
  safetyFlags: number;
  criticalAlertsToday: number;
  threatCount: number;
  fleetPercentile: number;
  latestTelemetry?: {
    ear: number | null;
    yaw: number | null;
    pitch: number | null;
    latencyMs: number | null;
  } | null;
  recentEvents: DriverDashboardEvent[];
  recentSessions: DriverDashboardSession[];
  weeklyScoreTrend: WeeklyScoreTrendPoint[];
  hourlyFocus: HourlyFocusPoint[];
  alertnessAnalysis: AlertnessAnalysisCategory[];
}

export interface DriverReportsResponse {
  hasData: boolean;
  totalSessions: number;
  totalHoursMonitored: number;
  totalMiles: number;
  weeklySafetyAverage: number;
  fatigueIncidentRatio: number;
  earStability: number | null;
  avgEar: number | null;
  forwardFocusPct: number | null;
  threatViolations: number;
  dailyScores: { label: string; value: number; day: string; hours: number; alerts: number }[];
  hourlyAlerts: { label: string; value: number }[];
  csvRows: (string | number)[][];
}

export interface DriverSessionsResponse {
  sessions: DriverDashboardSession[];
  total: number;
  page: number;
  pages: number;
}

export interface DriverEventsResponse {
  events: DriverDashboardEvent[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminDashboardResponse {
  enrolledDrivers: number;
  activeFeeds: number;
  alertsToday: number;
  drowsinessEvents: number;
  distractionEvents: number;
  threatDetections: number;
  safetyViolations: number;
  fleetSafetyScore: number;
  totalAlerts: number;
  totalSessions: number;
  resolvedAlertsToday: number;
  activeSessions: DriverDashboardSession[];
  fleetTrend: { day: string; date: string; drowsiness: number; distraction: number; other: number; sessions?: number }[];
  priorityAlerts: DriverDashboardEvent[];
}

export interface AdminDriverItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  avatar?: string | null;
  status: 'active' | 'inactive' | 'offline';
  isActive: boolean;
  safetyScore: number;
  totalSessions: number;
  totalHours: number;
  totalAlerts: number;
  memberSince: string;
}

export interface AdminDriversResponse {
  drivers: AdminDriverItem[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminDriverDetailResponse {
  id: string;
  name: string;
  email: string;
  vehicle?: string | null;
  avatar?: string | null;
  isActive: boolean;
  memberSince: string;
  totalSessions: number;
  avgSafetyScore: number;
  totalAlerts: number;
  recentSessions: DriverDashboardSession[];
  recentAlerts: DriverDashboardEvent[];
}

export interface AdminSessionsResponse {
  sessions: DriverDashboardSession[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminAlertsResponse {
  alerts: DriverDashboardEvent[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminAnalyticsResponse {
  fleetScoreTrend: { label: string; value: number; date: string; sessions: number }[];
  categoryDistribution: { label: string; value: number; percentage: string }[];
  hourlyViolationCurve: { label: string; value: number }[];
  fleetAttentionIndex: number;
  totalHoursMonitored: number;
  criticalSeverityRatio: string;
  threatClearances: number;
  totalAlerts: number;
  totalSessions: number;
  csvRows: (string | number)[][];
}

class ApiClient {
  private inMemoryAccessToken: string | null = null;

  public getAccessToken(): string | null {
    if (this.inMemoryAccessToken) return this.inMemoryAccessToken;
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('dg_access_token');
  }

  /**
   * Refresh tokens are stored in secure HttpOnly cookies.
   * Client-side JavaScript cannot and should not access refresh tokens.
   */
  public getRefreshToken(): null {
    return null;
  }

  public hasToken(): boolean {
    return !!this.getAccessToken();
  }

  public setTokens(access: string, _refresh?: string | null): void {
    this.inMemoryAccessToken = access;
    if (typeof window === 'undefined') return;
    localStorage.setItem('dg_access_token', access);
    // Explicitly purge any legacy refresh tokens from browser storage
    localStorage.removeItem('dg_refresh_token');
  }

  public clearTokens(): void {
    this.inMemoryAccessToken = null;
    if (typeof window === 'undefined') return;
    localStorage.removeItem('dg_access_token');
    localStorage.removeItem('dg_refresh_token');
    localStorage.removeItem('dg_user');
  }

  public setCurrentUser(user: ApiUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('dg_user', JSON.stringify(user));
  }

  public getCurrentUser(): ApiUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('dg_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : 'Network error';
      throw new Error(`Unable to connect to backend server (${msg}). Verify FastAPI backend is active at ${API_BASE_URL}.`);
    }

    // Handle token expiration & automatic refresh for authenticated requests via HttpOnly cookie
    if (
      response.status === 401 &&
      endpoint !== '/api/auth/login' &&
      endpoint !== '/api/auth/register' &&
      endpoint !== '/api/auth/refresh'
    ) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
        const retryResponse = await fetch(url, {
          credentials: 'include',
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          const errData = await retryResponse.json().catch(() => ({}));
          const detail = typeof errData.detail === 'string'
            ? errData.detail
            : Array.isArray(errData.detail)
            ? errData.detail.map((e: { msg?: string }) => e.msg || 'Validation error').join(', ')
            : 'Request failed';
          throw new Error(detail);
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      let errorDetail = errData.detail;
      if (Array.isArray(errorDetail)) {
        errorDetail = errorDetail.map((e: { msg?: string }) => e.msg || 'Validation error').join(', ');
      }
      throw new Error(errorDetail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  public async refreshToken(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const data: AuthResponse = await res.json();
      this.setTokens(data.access_token);
      this.setCurrentUser(data.user);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // --- Auth APIs ---
  public async login(email: string, password: string, role: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    this.setTokens(data.access_token);
    this.setCurrentUser(data.user);
    return data;
  }

  public async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    vehicle_id?: string;
  }): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setTokens(data.access_token);
    this.setCurrentUser(data.user);
    return data;
  }

  public async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => {});
    this.clearTokens();
  }

  public async getMe(): Promise<ApiUser> {
    const user = await this.request<ApiUser>('/api/auth/me');
    this.setCurrentUser(user);
    return user;
  }

  // --- Driver Dashboard APIs ---
  public async getDriverDashboard(): Promise<DriverDashboardResponse> {
    return this.request<DriverDashboardResponse>('/api/driver/dashboard');
  }

  public async getDriverSessions(page = 1, limit = 10): Promise<DriverSessionsResponse> {
    return this.request<DriverSessionsResponse>(`/api/driver/sessions?page=${page}&limit=${limit}`);
  }

  public async getDriverEvents(page = 1, limit = 20, category?: string, severity?: string): Promise<DriverEventsResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category && category !== 'all') params.append('category', category);
    if (severity && severity !== 'all') params.append('severity', severity);
    return this.request<DriverEventsResponse>(`/api/driver/events?${params.toString()}`);
  }

  public async getDriverAnalytics(): Promise<any> {
    return this.request('/api/driver/analytics');
  }

  public async getDriverReports(): Promise<DriverReportsResponse> {
    return this.request<DriverReportsResponse>('/api/driver/reports');
  }

  // --- Admin Dashboard APIs ---
  public async getAdminDashboard(): Promise<AdminDashboardResponse> {
    return this.request<AdminDashboardResponse>('/api/admin/dashboard');
  }

  public async getAdminDrivers(search?: string, page = 1, limit = 20): Promise<AdminDriversResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return this.request<AdminDriversResponse>(`/api/admin/drivers?${params.toString()}`);
  }

  public async createAdminDriver(payload: {
    name: string;
    email: string;
    vehicle?: string;
    phone?: string;
    password?: string;
  }): Promise<AdminDriverItem> {
    return this.request<AdminDriverItem>('/api/admin/drivers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async toggleDriverStatus(driverId: string): Promise<{ id: string; isActive: boolean; status: string }> {
    return this.request<{ id: string; isActive: boolean; status: string }>(`/api/admin/drivers/${driverId}/status`, {
      method: 'PATCH',
    });
  }

  public async getAdminDriverDetail(driverId: string): Promise<AdminDriverDetailResponse> {
    return this.request<AdminDriverDetailResponse>(`/api/admin/drivers/${driverId}`);
  }

  public async getAdminSessions(status?: string, search?: string, page = 1, limit = 20): Promise<AdminSessionsResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    return this.request<AdminSessionsResponse>(`/api/admin/sessions?${params.toString()}`);
  }

  public async getActiveSessions(): Promise<{ sessions: DriverDashboardSession[] }> {
    return this.request<{ sessions: DriverDashboardSession[] }>('/api/admin/sessions/active');
  }

  public async getAdminAlerts(
    page = 1,
    limit = 20,
    category?: string,
    severity?: string,
    acknowledged?: boolean
  ): Promise<AdminAlertsResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category && category !== 'all') params.append('category', category);
    if (severity && severity !== 'all') params.append('severity', severity);
    if (acknowledged !== undefined) params.append('acknowledged', String(acknowledged));
    return this.request<AdminAlertsResponse>(`/api/admin/alerts?${params.toString()}`);
  }

  public async getAdminAnalytics(timeRange = '7d'): Promise<AdminAnalyticsResponse> {
    return this.request<AdminAnalyticsResponse>(`/api/admin/analytics?time_range=${timeRange}`);
  }

  // --- Session Management ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async startSession(vehicle?: string): Promise<any> {
    const payload: { vehicle?: string } = {};
    if (vehicle && vehicle.trim()) {
      payload.vehicle = vehicle.trim();
    }
    return this.request('/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async stopSession(sessionId: string): Promise<any> {
    return this.request(`/api/sessions/${sessionId}/stop`, {
      method: 'POST',
    });
  }

  // --- Alert Actions ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async acknowledgeAlert(alertId: string): Promise<any> {
    return this.request(`/api/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  }
}

export const api = new ApiClient();
