"""
DriveGuard AI — Admin Seed Script
Creates the initial admin user and demo driver accounts.

Usage (from project root):
    python -m backend.app.seeds.create_admin
"""
import sys
import os

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from backend.app.core.security import hash_password
from backend.app.database.connection import SessionLocal, engine
from backend.app.database.base import Base
from backend.app.models.user import User
from backend.app.models.session import DrivingSession
from backend.app.models.alert import SafetyAlert
from backend.app.models.telemetry import TelemetryRecord
from backend.app.models.refresh_token import RefreshToken


def seed():
    """Create tables and seed admin + demo driver accounts."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("[SEED] Database tables created.")

    db = SessionLocal()
    try:
        # --- Admin Account ---
        admin_email = "ops.admin@driveguard.ai"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            admin = User(
                id="ADM-00000001",
                name="Sarah Jenkins",
                email=admin_email,
                hashed_password=hash_password("FleetOpsAdmin2026!"),
                role="admin",
                vehicle_id=None,
            )
            db.add(admin)
            print(f"[SEED] Admin created: {admin_email} / FleetOpsAdmin2026!")
        else:
            print(f"[SEED] Admin already exists: {admin_email}")

        # --- Demo Driver Account ---
        driver_email = "alex.mercer@safefleet.com"
        existing_driver = db.query(User).filter(User.email == driver_email).first()
        if not existing_driver:
            driver = User(
                id="DRV-00000042",
                name="Alex Mercer",
                email=driver_email,
                hashed_password=hash_password("DriveGuard2026!"),
                role="driver",
                vehicle_id="Volvo XC90 Safety Fleet #14",
            )
            db.add(driver)
            print(f"[SEED] Driver created: {driver_email} / DriveGuard2026!")
        else:
            print(f"[SEED] Driver already exists: {driver_email}")

        # --- Additional Demo Drivers ---
        demo_drivers = [
            ("DRV-00000019", "Elena Rostova", "elena.rostova@safefleet.com", "Freightliner Cascadia #03"),
            ("DRV-00000031", "Marcus Vance", "marcus.vance@safefleet.com", "Ford Transit Cargo #22"),
            ("DRV-00000055", "Sophia Lin", "sophia.lin@safefleet.com", "Kenworth T680 #88"),
            ("DRV-00000088", "Jamal Brooks", "jamal.brooks@safefleet.com", "Tesla Semi #07"),
        ]
        for did, name, email, vehicle in demo_drivers:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(
                    id=did,
                    name=name,
                    email=email,
                    hashed_password=hash_password("DriveGuard2026!"),
                    role="driver",
                    vehicle_id=vehicle,
                ))
                print(f"[SEED] Driver created: {email}")

        db.commit()
        print("[SEED] All seed data committed successfully.")

    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
