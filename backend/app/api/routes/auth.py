"""
DriveGuard AI — Authentication Routes
POST /api/auth/register   — Register a new driver (admin blocked)
POST /api/auth/login      — Login with email, password, role
POST /api/auth/refresh    — Refresh access token (reads HttpOnly cookie or body)
POST /api/auth/logout     — Revoke refresh token (clears HttpOnly cookie)
GET  /api/auth/me         — Get current user profile
"""
import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from backend.app.core.permissions import get_current_user
from backend.app.database.connection import get_db
from backend.app.models.user import User
from backend.app.models.refresh_token import RefreshToken
from backend.app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "dg_refresh_token"
COOKIE_PATH = "/api/auth"


def set_refresh_cookie(response: Response, raw_token: str) -> None:
    """Set secure HttpOnly cookie containing the refresh token."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=getattr(settings, "COOKIE_SECURE", False),
        samesite="lax",
        path=COOKIE_PATH,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


def clear_refresh_cookie(response: Response) -> None:
    """Clear the refresh token cookie upon logout."""
    response.delete_cookie(
        key=COOKIE_NAME,
        path=COOKIE_PATH,
    )


def verify_csrf(request: Request) -> None:
    """
    CSRF verification: ensure Origin or Referer header belongs
    to configured CORS allowed origins when modifying session state via cookies.
    """
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    allowed = set(settings.CORS_ORIGINS)

    if origin:
        if origin not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cross-origin request rejected (CSRF protection).",
            )
    elif referer:
        if not any(referer.startswith(o) for o in allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cross-origin request rejected (CSRF protection).",
            )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """Register a new driver account. Admin registration is blocked (seed only)."""
    # Block admin self-registration
    if payload.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts cannot be created through public registration. Contact your fleet operations manager.",
        )

    # Check duplicate email
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Create user
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="driver",
        vehicle_id=payload.vehicle_id,
    )
    db.add(user)
    db.flush()  # get user.id before creating tokens

    # Generate tokens
    access_token = create_access_token({"sub": user.id, "role": user.role})
    raw_refresh, token_hash = create_refresh_token(user.id)

    refresh_record = RefreshToken(
        token_hash=token_hash,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)
    db.commit()
    db.refresh(user)

    # Set secure HttpOnly cookie for refresh token
    set_refresh_cookie(response, raw_refresh)

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate user. The 'role' field is validated against the DB —
    a driver cannot login as admin and vice versa.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Contact your fleet administrator.",
        )

    # Role validation — the role in the request must match the user's actual role
    if user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as '{user.role}'. Please select the correct access terminal.",
        )

    # Generate tokens
    access_token = create_access_token({"sub": user.id, "role": user.role})
    raw_refresh, token_hash = create_refresh_token(user.id)

    # Revoke old refresh tokens for this user (single session)
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked == False,  # noqa: E712
    ).update({"revoked": True})

    refresh_record = RefreshToken(
        token_hash=token_hash,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)
    db.commit()

    # Set secure HttpOnly cookie for refresh token
    set_refresh_cookie(response, raw_refresh)

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(
    request: Request,
    response: Response,
    payload: RefreshRequest = None,
    db: Session = Depends(get_db),
):
    """
    Rotate the refresh token and issue a new access token.
    Reads token from secure HttpOnly cookie or request body (with CSRF verification).
    """
    verify_csrf(request)

    token_str = (payload.refresh_token if payload and payload.refresh_token else None) or request.cookies.get(COOKIE_NAME)
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing or expired.",
        )

    incoming_hash = hashlib.sha256(token_str.encode()).hexdigest()

    record = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == incoming_hash, RefreshToken.revoked == False)  # noqa: E712
        .first()
    )
    if not record or record.expires_at < datetime.now(timezone.utc):
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired.",
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user or not user.is_active:
        clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    # Revoke old token
    record.revoked = True

    # Issue new pair
    access_token = create_access_token({"sub": user.id, "role": user.role})
    new_raw, new_hash = create_refresh_token(user.id)
    new_record = RefreshToken(
        token_hash=new_hash,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_record)
    db.commit()

    # Set rotated HttpOnly cookie
    set_refresh_cookie(response, new_raw)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_raw,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    payload: RefreshRequest = None,
    db: Session = Depends(get_db),
):
    """Revoke the given refresh token and clear the HttpOnly cookie."""
    verify_csrf(request)

    token_str = (payload.refresh_token if payload and payload.refresh_token else None) or request.cookies.get(COOKIE_NAME)
    if token_str:
        incoming_hash = hashlib.sha256(token_str.encode()).hexdigest()
        db.query(RefreshToken).filter(RefreshToken.token_hash == incoming_hash).update({"revoked": True})
        db.commit()

    clear_refresh_cookie(response)
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return UserResponse.model_validate(user)
