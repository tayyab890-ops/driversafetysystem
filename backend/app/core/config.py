"""
DriveGuard AI — Application Configuration
Loads from environment variables / .env file.
"""
import os
from typing import List

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = "DriveGuard AI Backend"
        VERSION: str = "1.0.0"
        API_PREFIX: str = "/api"

        HOST: str = "0.0.0.0"
        PORT: int = 8000

        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./driveguard.db")

        JWT_SECRET: str = os.getenv("JWT_SECRET", "driveguard_super_secure_jwt_secret_key_2026_xyz_production")
        JWT_ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
        REFRESH_TOKEN_EXPIRE_DAYS: int = 7
        COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "False").lower() in ("true", "1")

        CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
        ]

        FRONTEND_URL: str = "http://localhost:3000"

        EAR_DROWSINESS_THRESHOLD: float = 0.180
        EAR_CONSEC_FRAMES: int = 15
        MAR_YAWN_THRESHOLD: float = 0.550
        HEAD_PITCH_DOWNWARD_THRESHOLD: float = -20.0
        HEAD_YAW_OFFROAD_THRESHOLD: float = 25.0

        PRETRAINED_DIR: str = "backend/pretrained_models"

        model_config = {
            "env_file": "backend/.env",
            "env_file_encoding": "utf-8",
            "extra": "ignore",
        }

except ImportError:
    # Zero-dependency fallback if pydantic_settings is not installed
    from pydantic import BaseModel
    class Settings(BaseModel):
        PROJECT_NAME: str = "DriveGuard AI Backend"
        VERSION: str = "1.0.0"
        API_PREFIX: str = "/api"

        HOST: str = "0.0.0.0"
        PORT: int = 8000

        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./driveguard.db")

        JWT_SECRET: str = os.getenv("JWT_SECRET", "driveguard_super_secure_jwt_secret_key_2026_xyz_production")
        JWT_ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
        REFRESH_TOKEN_EXPIRE_DAYS: int = 7
        COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "False").lower() in ("true", "1")

        CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
        ]

        FRONTEND_URL: str = "http://localhost:3000"

        EAR_DROWSINESS_THRESHOLD: float = 0.180
        EAR_CONSEC_FRAMES: int = 15
        MAR_YAWN_THRESHOLD: float = 0.550
        HEAD_PITCH_DOWNWARD_THRESHOLD: float = -20.0
        HEAD_YAW_OFFROAD_THRESHOLD: float = 25.0

        PRETRAINED_DIR: str = "backend/pretrained_models"


settings = Settings()
