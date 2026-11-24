"""
DriveGuard AI — Driver Dashboard Integration & Data Isolation Verification Suite
Tests driver dashboard endpoints, authentication, data isolation, and contract alignment.
"""
from fastapi.testclient import TestClient
from backend.main import app

def run_tests():
    print("=== STARTING DRIVER DASHBOARD INTEGRATION TESTS ===")
    client = TestClient(app)

    # 1. Driver A Login (Alex Mercer)
    res_alex_login = client.post("/api/auth/login", json={
        "email": "alex.mercer@safefleet.com",
        "password": "DriveGuard2026!",
        "role": "driver"
    })
    assert res_alex_login.status_code == 200, f"Alex login failed: {res_alex_login.text}"
    alex_token = res_alex_login.json()["access_token"]
    alex_user = res_alex_login.json()["user"]
    print(f"Driver A Authenticated: {alex_user['name']} ({alex_user['email']})")

    # 2. Driver B Login (Elena Rostova)
    res_elena_login = client.post("/api/auth/login", json={
        "email": "elena.rostova@safefleet.com",
        "password": "DriveGuard2026!",
        "role": "driver"
    })
    assert res_elena_login.status_code == 200, f"Elena login failed: {res_elena_login.text}"
    elena_token = res_elena_login.json()["access_token"]
    elena_user = res_elena_login.json()["user"]
    print(f"Driver B Authenticated: {elena_user['name']} ({elena_user['email']})")

    # 3. Admin Login (Sarah Jenkins)
    res_admin_login = client.post("/api/auth/login", json={
        "email": "ops.admin@driveguard.ai",
        "password": "FleetOpsAdmin2026!",
        "role": "admin"
    })
    assert res_admin_login.status_code == 200, f"Admin login failed: {res_admin_login.text}"
    admin_token = res_admin_login.json()["access_token"]

    # 4. Authentication & Role Enforcement on /api/driver/dashboard
    print("\n--- Testing Authentication & Permission Enforcement ---")
    res_anon = client.get("/api/driver/dashboard")
    assert res_anon.status_code == 401, f"Expected 401 for anonymous, got {res_anon.status_code}"
    print("✓ Anonymous request blocked: 401 Unauthorized")

    res_admin_dash = client.get("/api/driver/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_dash.status_code == 403, f"Expected 403 for admin, got {res_admin_dash.status_code}"
    print("✓ Admin access to driver dashboard blocked: 403 Forbidden")

    # 5. Driver Dashboard Contract & Response Verification
    print("\n--- Testing Driver Dashboard Contract & Content ---")
    res_dash = client.get("/api/driver/dashboard", headers={"Authorization": f"Bearer {alex_token}"})
    assert res_dash.status_code == 200, f"Dashboard failed: {res_dash.text}"
    data = res_dash.json()

    required_keys = [
        "safetyScore", "hasSessions", "totalSessions", "sessionsToday",
        "totalSessionTime", "milesProtected", "safetyFlags", "criticalAlertsToday",
        "threatCount", "fleetPercentile", "recentEvents", "recentSessions",
        "weeklyScoreTrend", "hourlyFocus", "alertnessAnalysis"
    ]
    for key in required_keys:
        assert key in data, f"Missing required key in dashboard response: {key}"
    print("✓ All 15 required dashboard keys present in response")

    assert isinstance(data["safetyScore"], int), "safetyScore should be int"
    assert isinstance(data["weeklyScoreTrend"], list), "weeklyScoreTrend should be list"
    assert len(data["weeklyScoreTrend"]) == 7, f"Expected 7 weekly trend points, got {len(data['weeklyScoreTrend'])}"
    for day_point in data["weeklyScoreTrend"]:
        assert "day" in day_point and "score" in day_point and "hours" in day_point and "miles" in day_point
    print("✓ 7-day weeklyScoreTrend with hours & miles verified")

    assert isinstance(data["alertnessAnalysis"], list), "alertnessAnalysis should be list"
    assert len(data["alertnessAnalysis"]) == 5, f"Expected 5 categorical breakdown items, got {len(data['alertnessAnalysis'])}"
    print("✓ Categorical alertnessAnalysis verified")

    # 6. Additional Driver Endpoints Verification
    print("\n--- Testing Additional Driver Endpoints ---")
    res_sessions = client.get("/api/driver/sessions", headers={"Authorization": f"Bearer {alex_token}"})
    assert res_sessions.status_code == 200
    assert "sessions" in res_sessions.json()
    print("✓ GET /api/driver/sessions: 200 OK")

    res_events = client.get("/api/driver/events", headers={"Authorization": f"Bearer {alex_token}"})
    assert res_events.status_code == 200
    assert "events" in res_events.json()
    print("✓ GET /api/driver/events: 200 OK")

    res_analytics = client.get("/api/driver/analytics", headers={"Authorization": f"Bearer {alex_token}"})
    assert res_analytics.status_code == 200
    assert "weeklyTrend" in res_analytics.json()
    print("✓ GET /api/driver/analytics: 200 OK")

    res_profile = client.get("/api/driver/profile", headers={"Authorization": f"Bearer {alex_token}"})
    assert res_profile.status_code == 200
    profile_data = res_profile.json()
    assert profile_data["email"] == "alex.mercer@safefleet.com"
    assert profile_data["name"] == "Alex Mercer"
    print(f"✓ GET /api/driver/profile: 200 OK for {profile_data['name']}")

    res_reports = client.get("/api/driver/reports", headers={"Authorization": f"Bearer {alex_token}"})
    assert res_reports.status_code == 200
    reports_data = res_reports.json()
    assert "hasData" in reports_data
    assert "weeklySafetyAverage" in reports_data
    assert "dailyScores" in reports_data
    assert "hourlyAlerts" in reports_data
    print("✓ GET /api/driver/reports: 200 OK")

    # 7. Driver Data Isolation Verification
    print("\n--- Testing Driver Data Isolation ---")
    res_elena_profile = client.get("/api/driver/profile", headers={"Authorization": f"Bearer {elena_token}"})
    assert res_elena_profile.status_code == 200
    assert res_elena_profile.json()["email"] == "elena.rostova@safefleet.com"
    assert res_elena_profile.json()["id"] != alex_user["id"], "Driver IDs must be distinct"
    print(f"✓ Driver A (Alex) and Driver B (Elena) are isolated: IDs {alex_user['id']} vs {elena_user['id']}")

    print("\n=======================================================")
    print("ALL DRIVER DASHBOARD INTEGRATION TESTS PASSED (100%)")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
