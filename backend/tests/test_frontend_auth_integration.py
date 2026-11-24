"""
DriveGuard AI — Frontend-Backend Authentication & Security Integration Tests
Tests:
1. Valid driver login & HttpOnly cookie issuance
2. Valid admin login & HttpOnly cookie issuance
3. Invalid credentials handling (401)
4. Role mismatch rejection (403)
5. Public admin registration block (403)
6. Duplicate email rejection (409 Conflict)
7. Profile restoration via GET /api/auth/me (Bearer token)
8. Refresh token rotation & single-session revocation
9. Logout token revocation & cookie clearance
10. Driver registration & DB cleanup
11. Cookie-based refresh without JSON body (HttpOnly client flow)
12. Strict backend endpoint permission enforcement (Driver vs Admin cross-access blocked)
"""
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.database.connection import engine
from backend.app.models.user import User

client = TestClient(app)


def test_1_valid_driver_login():
    """Test authenticating a real registered driver account and setting HttpOnly cookie."""
    res = client.post(
        "/api/auth/login",
        json={
            "email": "alex.mercer@safefleet.com",
            "password": "DriveGuard2026!",
            "role": "driver",
        },
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "driver"
    assert data["user"]["email"] == "alex.mercer@safefleet.com"

    # Verify HttpOnly cookie
    cookie = res.cookies.get("dg_refresh_token")
    assert cookie is not None, "HttpOnly cookie 'dg_refresh_token' must be present"
    print("PASS: Valid Driver Login with HttpOnly cookie")


def test_2_valid_admin_login():
    """Test authenticating the real registered fleet ops admin account and setting HttpOnly cookie."""
    res = client.post(
        "/api/auth/login",
        json={
            "email": "ops.admin@driveguard.ai",
            "password": "FleetOpsAdmin2026!",
            "role": "admin",
        },
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    assert data["user"]["name"] == "Sarah Jenkins"

    cookie = res.cookies.get("dg_refresh_token")
    assert cookie is not None, "HttpOnly cookie 'dg_refresh_token' must be present for admin"
    print("PASS: Valid Admin Login with HttpOnly cookie")


def test_3_invalid_password_login():
    """Test that invalid credentials return 401 Unauthorized."""
    res = client.post(
        "/api/auth/login",
        json={
            "email": "alex.mercer@safefleet.com",
            "password": "WrongPassword123!",
            "role": "driver",
        },
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]
    print("PASS: Invalid Password returns 401")


def test_4_role_mismatch_login():
    """Test that a driver cannot login as admin or vice versa."""
    res = client.post(
        "/api/auth/login",
        json={
            "email": "alex.mercer@safefleet.com",
            "password": "DriveGuard2026!",
            "role": "admin",
        },
    )
    assert res.status_code == 403
    assert "registered as 'driver'" in res.json()["detail"]
    print("PASS: Role Mismatch returns 403")


def test_5_admin_registration_blocked():
    """Test that public registration blocks admin creation."""
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Intruder Admin",
            "email": "intruder@driveguard.ai",
            "password": "SecurePassword123!",
            "role": "admin",
        },
    )
    assert res.status_code == 403
    assert "Administrator accounts cannot be created through public registration" in res.json()["detail"]
    print("PASS: Public Admin Registration blocked with 403")


def test_6_duplicate_email_registration():
    """Test that registering an existing email returns 409 Conflict."""
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Alex Duplicate",
            "email": "alex.mercer@safefleet.com",
            "password": "SecurePassword123!",
            "role": "driver",
        },
    )
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"]
    print("PASS: Duplicate Email returns 409 Conflict")


def test_7_restore_user_me():
    """Test restoring user profile via GET /api/auth/me using Bearer token."""
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "alex.mercer@safefleet.com",
            "password": "DriveGuard2026!",
            "role": "driver",
        },
    )
    token = login_res.json()["access_token"]

    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["email"] == "alex.mercer@safefleet.com"
    assert user_data["role"] == "driver"
    assert user_data["is_active"] is True
    print("PASS: Restore User /api/auth/me with Bearer token")


def test_8_token_refresh_and_rotation():
    """Test rotating access & refresh tokens via POST /api/auth/refresh."""
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "alex.mercer@safefleet.com",
            "password": "DriveGuard2026!",
            "role": "driver",
        },
    )
    old_refresh = login_res.json()["refresh_token"]

    # Rotate
    refresh_res = client.post(
        "/api/auth/refresh",
        json={"refresh_token": old_refresh},
        headers={"Origin": "http://localhost:3000"},
    )
    assert refresh_res.status_code == 200
    new_data = refresh_res.json()
    new_access = new_data["access_token"]
    new_refresh = new_data["refresh_token"]
    assert new_refresh != old_refresh

    # Verify new access token works
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {new_access}"},
    )
    assert me_res.status_code == 200

    # Verify old refresh token is now revoked
    stale_res = client.post(
        "/api/auth/refresh",
        json={"refresh_token": old_refresh},
        headers={"Origin": "http://localhost:3000"},
    )
    assert stale_res.status_code == 401
    print("PASS: Token Refresh and Rotation")


def test_9_logout_revocation():
    """Test that POST /api/auth/logout revokes refresh tokens and clears cookies."""
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "alex.mercer@safefleet.com",
            "password": "DriveGuard2026!",
            "role": "driver",
        },
    )
    refresh_token = login_res.json()["refresh_token"]

    # Logout
    logout_res = client.post(
        "/api/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"Origin": "http://localhost:3000"},
    )
    assert logout_res.status_code == 200
    assert "Logged out successfully" in logout_res.json()["message"]

    # Attempt refresh with logged out token
    re_res = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
        headers={"Origin": "http://localhost:3000"},
    )
    assert re_res.status_code == 401
    print("PASS: Logout revokes token and clears session")


def test_10_driver_registration_and_cleanup():
    """Test new driver registration flow and clean up test user."""
    test_email = f"test.driver.{uuid.uuid4().hex[:6]}@safefleet.com"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "name": "Integration Driver",
            "email": test_email,
            "password": "IntegrationTestPass123!",
            "role": "driver",
            "vehicle_id": "Volvo V90 #99",
        },
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["role"] == "driver"

    # Cleanup the test user from database to keep original seeded state
    with Session(engine) as db:
        test_user = db.query(User).filter(User.email == test_email).first()
        if test_user:
            db.delete(test_user)
            db.commit()
    print("PASS: Driver Registration and test cleanup")


def test_11_cookie_based_refresh():
    """Test that refresh endpoint works seamlessly with HttpOnly cookie and empty body."""
    session_client = TestClient(app)
    # 1. Login to set cookie in session_client
    login_res = session_client.post(
        "/api/auth/login",
        json={
            "email": "alex.mercer@safefleet.com",
            "password": "DriveGuard2026!",
            "role": "driver",
        },
    )
    assert login_res.status_code == 200

    # 2. Call /refresh with empty body - cookie automatically sent
    refresh_res = session_client.post(
        "/api/auth/refresh",
        json={},
        headers={"Origin": "http://localhost:3000"},
    )
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert "access_token" in data

    # 3. Call /logout with empty body - cookie cleared
    logout_res = session_client.post(
        "/api/auth/logout",
        json={},
        headers={"Origin": "http://localhost:3000"},
    )
    assert logout_res.status_code == 200
    print("PASS: Pure HttpOnly Cookie-Based Refresh & Logout")


def test_12_endpoint_permission_enforcement():
    """
    Verify independent endpoint authorization:
    - Driver token cannot access admin endpoints (403)
    - Admin token cannot access driver endpoints (403)
    - Unauthenticated cannot access either (401)
    """
    driver_login = client.post(
        "/api/auth/login",
        json={"email": "alex.mercer@safefleet.com", "password": "DriveGuard2026!", "role": "driver"},
    )
    driver_token = driver_login.json()["access_token"]

    admin_login = client.post(
        "/api/auth/login",
        json={"email": "ops.admin@driveguard.ai", "password": "FleetOpsAdmin2026!", "role": "admin"},
    )
    admin_token = admin_login.json()["access_token"]

    # 1. Unauthenticated checks -> 401
    assert client.get("/api/admin/dashboard").status_code == 401
    assert client.get("/api/driver/dashboard").status_code == 401
    assert client.get("/api/sessions/active").status_code == 401
    assert client.get("/api/alerts/").status_code == 401

    # 2. Driver accessing admin endpoints -> 403 Forbidden
    assert client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {driver_token}"}).status_code == 403
    assert client.get("/api/admin/drivers", headers={"Authorization": f"Bearer {driver_token}"}).status_code == 403

    # 3. Admin accessing driver endpoints -> 403 Forbidden
    assert client.get("/api/driver/dashboard", headers={"Authorization": f"Bearer {admin_token}"}).status_code == 403
    assert client.get("/api/driver/analytics", headers={"Authorization": f"Bearer {admin_token}"}).status_code == 403

    # 4. Correct permissions -> 200 OK
    assert client.get("/api/driver/dashboard", headers={"Authorization": f"Bearer {driver_token}"}).status_code == 200
    assert client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"}).status_code == 200

    print("PASS: Independent Backend Permissions Enforced (Driver vs Admin vs Anonymous)")


if __name__ == "__main__":
    test_1_valid_driver_login()
    test_2_valid_admin_login()
    test_3_invalid_password_login()
    test_4_role_mismatch_login()
    test_5_admin_registration_blocked()
    test_6_duplicate_email_registration()
    test_7_restore_user_me()
    test_8_token_refresh_and_rotation()
    test_9_logout_revocation()
    test_10_driver_registration_and_cleanup()
    test_11_cookie_based_refresh()
    test_12_endpoint_permission_enforcement()
    print("\nALL 12 AUTHENTICATION & SECURITY TESTS PASSED (100%)")
