"""
DriveGuard AI — Backend End-to-End Architecture Verification Suite
Tests imports, database connectivity, table integrity, JWT auth, and dashboard APIs.
"""
import sys
from fastapi.testclient import TestClient
from sqlalchemy import text

# 1. Import Test
from backend.main import app
from backend.app.database.connection import engine

def run_tests():
    print("=== 1. IMPORT & STARTUP TEST ===")
    print(f"FastAPI App successfully loaded from backend.main: {app.title} v{app.version}")

    # 2. Database Connectivity & Data Preservation Test
    print("\n=== 2. DATABASE CONNECTIVITY & DATA TEST ===")
    with engine.connect() as conn:
        version = conn.execute(text("SELECT version();")).scalar()
        print("Connected to PostgreSQL:", version.split()[0], version.split()[1])

        tables_query = text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
        tables = [r[0] for r in conn.execute(tables_query).fetchall()]
        print("Existing Tables Preserved:", tables)

        user_count = conn.execute(text("SELECT COUNT(*) FROM users;")).scalar()
        print("Users in DB (Preserved):", user_count)
        assert user_count >= 6, f"Expected at least 6 users, found {user_count}"

    # 3. Authentication Tests
    print("\n=== 3. AUTHENTICATION & SECURITY TESTS ===")
    client = TestClient(app)

    # Health check
    res_health = client.get("/health")
    assert res_health.status_code == 200, "Health check failed"
    print("GET /health:", res_health.status_code, res_health.json())

    # Driver login
    res_driver_login = client.post("/api/auth/login", json={
        "email": "alex.mercer@safefleet.com",
        "password": "DriveGuard2026!",
        "role": "driver"
    })
    assert res_driver_login.status_code == 200, f"Driver login failed: {res_driver_login.text}"
    driver_token = res_driver_login.json()["access_token"]
    driver_user = res_driver_login.json()["user"]
    print(f"Driver Login (Alex Mercer): 200 OK | Token Issued | Role: {driver_user['role']}")

    # Admin login
    res_admin_login = client.post("/api/auth/login", json={
        "email": "ops.admin@driveguard.ai",
        "password": "FleetOpsAdmin2026!",
        "role": "admin"
    })
    assert res_admin_login.status_code == 200, f"Admin login failed: {res_admin_login.text}"
    admin_token = res_admin_login.json()["access_token"]
    admin_user = res_admin_login.json()["user"]
    print(f"Admin Login (Sarah Jenkins): 200 OK | Token Issued | Role: {admin_user['role']}")

    # Public Admin registration blocking test
    res_admin_reg = client.post("/api/auth/register", json={
        "name": "Unauthorized",
        "email": "unauth@test.com",
        "password": "Password123!",
        "role": "admin"
    })
    assert res_admin_reg.status_code == 403, "Admin self-registration was NOT blocked!"
    print("Admin Registration Blocked: 403 Forbidden (Verified)")

    # 4. Driver Dashboard API Test
    print("\n=== 4. DRIVER DASHBOARD API TEST ===")
    res_driver_dash = client.get("/api/driver/dashboard", headers={"Authorization": f"Bearer {driver_token}"})
    assert res_driver_dash.status_code == 200, f"Driver dashboard failed: {res_driver_dash.text}"
    dash_data = res_driver_dash.json()
    print("GET /api/driver/dashboard: 200 OK")
    print(f"  - Safety Score: {dash_data.get('safetyScore')}")
    print(f"  - Fleet Percentile: {dash_data.get('fleetPercentile')}")
    print(f"  - Sessions Today: {dash_data.get('sessionsToday')}")
    print(f"  - Weekly Trend Points: {len(dash_data.get('weeklyScoreTrend', []))}")

    # 5. Admin Dashboard API Test
    print("\n=== 5. ADMIN DASHBOARD API TEST ===")
    res_admin_dash = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_dash.status_code == 200, f"Admin dashboard failed: {res_admin_dash.text}"
    admin_data = res_admin_dash.json()
    print("GET /api/admin/dashboard: 200 OK")
    print(f"  - Enrolled Drivers: {admin_data.get('enrolledDrivers')}")
    print(f"  - Active Feeds: {admin_data.get('activeFeeds')}")
    print(f"  - Alerts Today: {admin_data.get('alertsToday')}")
    print(f"  - Fleet Trend Points: {len(admin_data.get('fleetTrend', []))}")

    # 6. Sessions & Alerts API Tests
    print("\n=== 6. SESSIONS & ALERTS API TESTS ===")
    res_sessions = client.get("/api/sessions/active", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_sessions.status_code == 200, "Active sessions query failed"
    print(f"GET /api/sessions/active: 200 OK | Count: {len(res_sessions.json().get('sessions', []))}")

    res_alerts = client.get("/api/alerts/", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_alerts.status_code == 200, "Alerts list query failed"
    print(f"GET /api/alerts/: 200 OK | Count: {len(res_alerts.json().get('alerts', []))}")

    print("\n=============================================")
    print("ALL ARCHITECTURE CLEANUP TESTS PASSED (100%)")
    print("=============================================")

if __name__ == "__main__":
    run_tests()
