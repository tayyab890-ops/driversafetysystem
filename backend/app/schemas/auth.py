"""
DriveGuard AI — Auth Schemas (Request & Response)
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="driver")  # Only 'driver' allowed from public endpoint
    vehicle_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = Field(default="driver")  # UI preference — validated against DB


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    vehicle_id: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


# Forward reference resolution
TokenResponse.model_rebuild()
