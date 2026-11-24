"""
DriveGuard AI — Backend Root Entrypoint
Exports app from backend.app.main for convenience.
"""
from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    from backend.app.core.config import settings
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
