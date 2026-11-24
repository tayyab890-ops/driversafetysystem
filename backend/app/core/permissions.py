"""
DriveGuard AI — Role-Based Access Control Dependencies
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.security import oauth2_scheme, decode_access_token
from backend.app.database.connection import get_db
from backend.app.models.user import User


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate the current user from the JWT access token."""
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated",
        )
    return user


def require_driver(user: User = Depends(get_current_user)) -> User:
    """Require the current user to have the 'driver' role."""
    if user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver access required",
        )
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Require the current user to have the 'admin' role."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return user
