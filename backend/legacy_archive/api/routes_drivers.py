"""
DriveGuard AI — Driver Directory API Routes
"""
from fastapi import APIRouter

router = APIRouter(prefix="/drivers", tags=["Drivers"])

@router.get("/")
async def list_drivers():
    """List enrolled drivers with qualification and fleet vehicle assignment."""
    return [
        {"id": "DRV-042", "name": "Alex Mercer", "vehicle": "Volvo XC90 #14", "status": "in_transit", "score": 88},
        {"id": "DRV-019", "name": "Elena Rostova", "vehicle": "Tesla Semi #03", "status": "in_transit", "score": 98},
        {"id": "DRV-031", "name": "Marcus Vance", "vehicle": "Freightliner #12", "status": "in_transit", "score": 74},
        {"id": "DRV-055", "name": "Sophia Lin", "vehicle": "Kenworth T680 #88", "status": "in_transit", "score": 94},
    ]
