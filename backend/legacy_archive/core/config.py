"""
DriveGuard AI — Configuration & Constants
"""
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DriveGuard AI Backend"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Server Host & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Origins (allow local frontend dev)
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./driveguard.db")
    
    # Computer Vision Telemetry Thresholds
    EAR_DROWSINESS_THRESHOLD: float = 0.180      # Eye Aspect Ratio threshold (sluggish / microsleep)
    EAR_CONSEC_FRAMES: int = 15                  # Consecutive frames (~1.8 seconds at 10-15 FPS inference)
    MAR_YAWN_THRESHOLD: float = 0.550            # Mouth Aspect Ratio threshold
    HEAD_PITCH_DOWNWARD_THRESHOLD: float = -20.0 # Degrees downward departure (phone glance)
    HEAD_YAW_OFFROAD_THRESHOLD: float = 25.0     # Degrees left/right departure
    
    # Model Weights Path
    PRETRAINED_DIR: str = os.path.join(os.path.dirname(__file__), "..", "models", "pretrained")
    
    class Config:
        env_file = ".env"

settings = Settings()
