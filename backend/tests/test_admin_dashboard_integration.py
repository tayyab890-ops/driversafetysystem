"""
DriveGuard AI — Admin Dashboard Integration & Security Audit Suite
Tests admin endpoints, RBAC enforcement, driver enrollment, session triage, alerts, and analytics.
"""
import uuid
from fastapi.testclient import TestClient
from backend.main import app

def run_tests():
    print("=== STARTING ADMIN DASHBOARD INTEGRATION & SECURITY TESTS ===")
    client = TestClient(app)

    # 1. Admin Login
    res_admin_login = client.post("/api/auth/login", json={
        "email": "ops.admin@driveguard.ai",
        "password": "FleetOpsAdmin2026!",
        "role": "admin"
    })
    assert res_admin_login.status_code == 200, f"Admin login failed: {res_admin_login.text}"
    admin_token = res_admin_login.json()["access_token"]
    print("✓ Admin Authenticated successfully (ops.admin@driveguard.ai)")

    # 2. Driver Login
    res_driver_login = client.post("/api/auth/login", json={
        "email": "alex.mercer@safefleet.com",
        "password": "DriveGuard2026!",
        "role": "driver"
    })
    assert res_driver_login.status_code == 200, f"Driver login failed: {res_driver_login.text}"
    driver_token = res_driver_login.json()["access_token"]
    print("✓ Commercial Driver Authenticated (alex.mercer@safefleet.com)")

    # 3. RBAC & Security Checks: Anonymous (401) and Driver (403)
    print("\n--- Testing RBAC Security Restrictions on Admin Endpoints ---")
    admin_endpoints = [
        "/api/admin/dashboard",
        "/api/admin/drivers",
        "/api/admin/sessions",
        "/api/admin/alerts",
        "/api/admin/analytics",
    ]

    for ep in admin_endpoints:
        # Anonymous test
        r_anon = client.get(ep)
        assert r_anon.status_code == 401, f"Expected 401 for anonymous on {ep}, got {r_anon.status_code}"
        
        # Driver test (must be forbidden)
        r_driver = client.get(ep, headers={"Authorization": f"Bearer {driver_token}"})
        assert r_driver.status_code == 403, f"Expected 403 for driver on {ep}, got {r_driver.status_code}"
        print(f"✓ {ep} strictly protected: 401 for anonymous, 403 for driver")

    # 4. GET /api/admin/dashboard
    print("\n--- Testing GET /api/admin/dashboard ---")
    res_dash = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_dash.status_code == 200, f"Admin dashboard failed: {res_dash.text}"
    dash_data = res_dash.json()
    assert "fleetSafetyScore" in dash_data, "Missing fleetSafetyScore"
    assert "enrolledDrivers" in dash_data, "Missing enrolledDrivers"
    assert "activeFeeds" in dash_data, "Missing activeFeeds"
    assert "fleetTrend" in dash_data, "Missing fleetTrend"
    assert "activeSessions" in dash_data, "Missing activeSessions"
    assert "priorityAlerts" in dash_data, "Missing priorityAlerts"
    print(f"✓ Dashboard response verified: {dash_data['enrolledDrivers']} enrolled drivers, fleet score {dash_data['fleetSafetyScore']}")

    # 5. GET /api/admin/drivers
    print("\n--- Testing GET /api/admin/drivers ---")
    res_drivers = client.get("/api/admin/drivers", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_drivers.status_code == 200, f"Drivers failed: {res_drivers.text}"
    drivers_data = res_drivers.json()
    assert "drivers" in drivers_data, "Missing drivers array"
    assert "total" in drivers_data, "Missing total count"
    assert len(drivers_data["drivers"]) >= 1, "Expected at least 1 registered driver"
    sample_driver = drivers_data["drivers"][0]
    print(f"✓ Drivers list verified: {drivers_data['total']} drivers found. Sample: {sample_driver['name']} ({sample_driver['id']})")

    # 6. POST /api/admin/drivers (Enroll Driver)
    print("\n--- Testing POST /api/admin/drivers ---")
    unique_suffix = str(uuid.uuid4())[:6]
    new_driver_payload = {
        "name": f"Test Commercial Driver {unique_suffix}",
        "email": f"test.driver.{unique_suffix}@safefleet.com",
        "phone": "+1 (555) 019-9999",
        "vehicle": f"VOLVO-TEST-#{unique_suffix}"
    }
    res_enroll = client.post(
        "/api/admin/drivers",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=new_driver_payload
    )
    assert res_enroll.status_code == 201, f"Driver enroll failed: {res_enroll.text}"
    enrolled_data = res_enroll.json()
    assert enrolled_data.get("status") == "success" or "id" in enrolled_data
    created_driver = enrolled_data.get("driver", enrolled_data)
    created_id = created_driver["id"]
    print(f"✓ Driver successfully enrolled: {created_driver['name']} ({created_id}) with vehicle {created_driver['vehicle']}")

    # 7. PATCH /api/admin/drivers/{driver_id}/status (Toggle Status)
    print("\n--- Testing PATCH /api/admin/drivers/{driver_id}/status ---")
    res_toggle_1 = client.patch(
        f"/api/admin/drivers/{created_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_toggle_1.status_code == 200, f"Status toggle failed: {res_toggle_1.text}"
    status_1 = res_toggle_1.json()["status"]
    print(f"✓ Status toggled to: {status_1}")

    res_toggle_2 = client.patch(
        f"/api/admin/drivers/{created_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_toggle_2.status_code == 200, f"Status toggle failed: {res_toggle_2.text}"
    status_2 = res_toggle_2.json()["status"]
    assert status_1 != status_2, f"Status did not toggle: {status_1} == {status_2}"
    print(f"✓ Status toggled back to: {status_2}")

    # 8. GET /api/admin/sessions
    print("\n--- Testing GET /api/admin/sessions ---")
    res_sessions = client.get("/api/admin/sessions", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_sessions.status_code == 200, f"Sessions failed: {res_sessions.text}"
    sess_data = res_sessions.json()
    assert "sessions" in sess_data, "Missing sessions array"
    assert "total" in sess_data, "Missing total count"
    assert "activeCount" in sess_data, "Missing activeCount"
    print(f"✓ Sessions endpoint verified: {sess_data['total']} total sessions, {sess_data['activeCount']} active")

    # 9. GET /api/admin/alerts
    print("\n--- Testing GET /api/admin/alerts ---")
    res_alerts = client.get("/api/admin/alerts", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_alerts.status_code == 200, f"Alerts failed: {res_alerts.text}"
    alerts_data = res_alerts.json()
    assert "alerts" in alerts_data, "Missing alerts array"
    assert "total" in alerts_data, "Missing total count"
    assert "unacknowledgedCount" in alerts_data, "Missing unacknowledgedCount"
    print(f"✓ Alerts endpoint verified: {alerts_data['total']} total alerts, {alerts_data['unacknowledgedCount']} triage required")

    # 10. GET /api/admin/analytics
    print("\n--- Testing GET /api/admin/analytics (7d, 30d, 90d) ---")
    for tr in ["7d", "30d", "90d"]:
        res_analytics = client.get(f"/api/admin/analytics?time_range={tr}", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_analytics.status_code == 200, f"Analytics for {tr} failed: {res_analytics.text}"
        an_data = res_analytics.json()
        assert "fleetScoreTrend" in an_data, f"Missing fleetScoreTrend for {tr}"
        assert "categoryDistribution" in an_data, f"Missing categoryDistribution for {tr}"
        assert "hourlyViolationCurve" in an_data, f"Missing hourlyViolationCurve for {tr}"
        assert "fleetAttentionIndex" in an_data, f"Missing fleetAttentionIndex for {tr}"
        assert "totalHoursMonitored" in an_data, f"Missing totalHoursMonitored for {tr}"
        assert "criticalSeverityRatio" in an_data, f"Missing criticalSeverityRatio for {tr}"
        assert "threatClearances" in an_data, f"Missing threatClearances for {tr}"
        print(f"✓ Analytics ({tr}) verified: Attention Index {an_data['fleetAttentionIndex']}, Monitored {an_data['totalHoursMonitored']}h")

    print("\n=======================================================")
    print("ALL ADMIN DASHBOARD INTEGRATION & SECURITY TESTS PASSED!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
