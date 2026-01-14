"""
Kupuri Studios - Router Registration
Central module for registering all API routers
"""

from fastapi import FastAPI

def register_routers(app: FastAPI) -> None:
    """
    Register all API routers with the FastAPI app
    Import and include routers here for clean organization
    """
    
    # Import routers
    from routers.video_script_router import router as video_router
    from routers.payments_router import router as payments_router
    
    # Try to import existing routers if they exist
    try:
        from routers.transcription_router import router as transcription_router
        app.include_router(transcription_router)
    except ImportError:
        pass
    
    try:
        from routers.litellm_router import router as litellm_router
        app.include_router(litellm_router)
    except ImportError:
        pass
    
    try:
        from routers.heygen_router import router as heygen_router
        app.include_router(heygen_router)
    except ImportError:
        pass
    
    try:
        from routers.elevenlabs_router import router as elevenlabs_router
        app.include_router(elevenlabs_router)
    except ImportError:
        pass
    
    # Register new MVP routers
    app.include_router(video_router)
    app.include_router(payments_router)
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "service": "kupuri-api"}
    
    @app.get("/")
    async def root():
        return {
            "name": "Kupuri Studios API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health"
        }
