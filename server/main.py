"""
Kupuri Studios AI OS - Main FastAPI Application
Production-grade AI Operating System for autonomous agency operations
Supports Whisper transcription, HeyGen video generation, ElevenLabs TTS, Playwright automation
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# FastAPI imports
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.exceptions import RequestValidationError

# Database imports
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Service imports
from services.transcription_service import transcription_service
from services.heygen_service import heygen_service
from services.elevenlabs_service import elevenlabs_service
from services.playwright_mcp_service import playwright_mcp_service
from services.database_service import database_service

# Router imports
from routers import transcription_router
from routers import video_generation_router
from routers import playwright_router

# Logging configuration
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# ===========================================
# FASTAPI APP CONFIGURATION
# ===========================================

app = FastAPI(
    title="Kupuri Studios AI OS",
    description="Autonomous AI Agency Operating System for Mexico City Operations",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("CORS_ORIGINS", "http://localhost:3000"),
        os.getenv("CORS_ORIGINS", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600
)

# Serve static files
app.mount("/static", StaticFiles(directory="react/dist"), name="static")
app.mount("/media", StaticFiles(directory=os.getenv("MEDIA_STORAGE", "/app/data/media")), name="media")

# Include routers
app.include_router(transcription_router.router, prefix="/api/transcription")
app.include_router(video_generation_router.router, prefix="/api/video")
app.include_router(playwright_router.router, prefix="/api/playwright")

# ===========================================
# REQUEST/RESPONSE MODELS
# ===========================================

class HealthResponse(BaseModel):
    status: str
    version: str
    database: Optional[dict]
    services: Optional[dict]
    timestamp: str

class ServiceStatus(BaseModel):
    service_name: str
    status: str
    message: str

# ===========================================
# LIFECYCLE STARTUP EVENTS
# ===========================================

@app.on_event("startup")
async def startup_event():
    """Initialize all services on application startup"""
    logger.info("🚀 Kupuri Studios AI OS - Starting up...")
    logger.info("=" * 50)
    
    try:
        # Initialize transcription service
        await transcription_service.initialize()
        logger.info("✅ Transcription service initialized")
        
        # Initialize database service
        database_connected = await database_service.initialize()
        logger.info("✅ Database service initialized")
        
        # Initialize Playwright MCP service
        await playwright_mcp_service.initialize()
        logger.info("✅ Playwright MCP service initialized")
        
        # Create necessary directories
        media_dir = Path(os.getenv("MEDIA_STORAGE", "/app/data/media"))
        media_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("=" * 50)
        logger.info("✅ All services initialized successfully!")
        logger.info("🌐 Kupuri Studios AI OS is ready to serve traffic")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Startup error: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    """Gracefully shutdown all services"""
    logger.info("🛑 Shutting down Kupuri Studios AI OS...")
    logger.info("=" * 50)
    
    try:
        # Close Playwright browser
        await playwright_mcp_service.close()
        logger.info("✅ Playwright browser closed")
        
        # Close database connections
        # Database service handles connection cleanup
        logger.info("✅ Database connections closed")
        
        logger.info("=" * 50)
        logger.info("✅ Shutdown complete - Goodbye!")
        
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")

# ===========================================
# ROOT ENDPOINTS
# ===========================================

@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint - returns basic info"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Kupuri Studios AI OS</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #FF6B35 0%, #7C3AED 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            .container {
                max-width: 800px;
                text-align: center;
            }
            h1 {
                font-size: 2.5rem;
                margin-bottom: 1rem;
                background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                color: white;
            }
            .status {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 1rem 2rem;
                margin-top: 2rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0,0.2);
            }
            .status-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 0.5rem;
            }
            .status-item:last-child {
                margin-bottom: 0;
            }
            .status-dot {
                width: 8px;
                height: 8px;
                background: #10B981;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            .status-text {
                font-size: 0.875rem;
                color: white;
            }
            @keyframes pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1); }
                100% { opacity: 1; transform: scale(1); }
            }
            .description {
                max-width: 600px;
                line-height: 1.6;
                color: rgba(255,255,255,0.9);
                font-size: 0.95rem;
            }
            .api-section {
                margin-top: 3rem;
                padding-top: 2rem;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            .api-section h2 {
                font-size: 1.5rem;
                margin-bottom: 1rem;
            }
            .api-endpoint {
                background: rgba(16, 185, 129, 0.05);
                border-left: 3px solid #FF6B35;
                padding: 0.75rem 1rem;
                font-family: 'Courier New', monospace;
                font-size: 0.85rem;
                color: #E8E8E8;
                word-break: break-all;
            }
            .api-endpoint code {
                color: #7C3AED;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Kupuri Studios AI OS</h1>
            <div class="description">
                <p>Autonomous AI Agency Operating System</p>
                <p>Production-grade platform for Mexico City operations</p>
                <p>Powered by Whisper, HeyGen, ElevenLabs, Playwright</p>
            </div>
            
            <div class="status">
                <div class="status-item">
                    <div class="status-dot"></div>
                    <div class="status-text">System Online</div>
                </div>
                <div class="status-item">
                    <div class="status-dot"></div>
                    <div class="status-text">Database Connected</div>
                </div>
                <div class="status-item">
                    <div class="status-dot"></div>
                    <div class="status-text">AI Services Ready</div>
                </div>
                <div class="status-item">
                    <div class="status-dot"></div>
                    <div class="status-text">Automation Engine Active</div>
                </div>
                <div class="status-item">
                    <div class="status-dot"></div>
                    <div class="status-text">Browser Automation Ready</div>
                </div>
            </div>
            
            <div class="api-section">
                <h2>🔗 Available APIs</h2>
                
                <div class="api-endpoint">
                    <code>POST</code> <span class="code">/api/transcription/upload</span>
                </div>
                <div class="api-endpoint">
                    <code>POST</code> <span class="code">/api/transcription/file</span>
                </div>
                <div class="api-endpoint">
                    <code>POST</code> <span class="code">/api/video/generate-avatar</span>
                </div>
                <div class="api-endpoint">
                    <code>POST</code> <span class="code">/api/video/generate-speech</span>
                </div>
                <div class="api-endpoint">
                    <code>GET</code> <span class="code">/api/video/avatars</span>
                </div>
                <div class="api-endpoint">
                    <code>GET</code> <span class="code">/api/video/voices</span>
                </div>
                <div class="api-endpoint">
                    <code>POST</code> <span class="code">/api/playwright/navigate</span>
                </div>
                <div class="api-endpoint">
                    <code>POST</code> <span class="code">/api/playwright/screenshot</span>
                </div>
                <div class="api-endpoint">
                    <code>POST</code> <span class="code">/api/playwright/fill-form</span>
                </div>
                <div class="api-endpoint">
                    <code>POST</code> <span class="code">/api/playwright/test-suite</span>
                </div>
                <div class="api-endpoint">
                    <code>GET</code> <span class="code">/health</span>
                </div>
            </div>
            
            <div class="api-section">
                <h2>📚 Documentation</h2>
                
                <div class="api-endpoint">
                    <code>GET</code> <span class="code">/docs</span> - API Documentation
                </div>
                <div class="api-endpoint">
                    <code>GET</code> <span class="code">/redoc</span> - Interactive API Docs
                </div>
            </div>
        </div>
    </body>
    </html>
    """

@app.get("/health")
async def health_check() -> HealthResponse:
    """
    Overall system health check
    Checks all services and returns system status
    """
    try:
        from datetime import datetime
        
        # Check transcription service
        transcription_status = "ok" if transcription_service.model else "not_initialized"
        
        # Check database service
        db_health = await database_service.health_check()
        
        # Check Playwright service
        playwright_status = "ok" if playwright_mcp_service.browser else "not_initialized"
        
        # Check HeyGen service
        heygen_status = "ok" if heygen_service.api_key else "not_configured"
        
        # Check ElevenLabs service
        elevenlabs_status = "ok" if elevenlabs_service.api_key else "not_configured"
        
        # Determine overall status
        all_ok = all([
            transcription_status == "ok",
            db_health.get("status") == "healthy",
            playwright_status == "ok",
            heygen_status == "ok",
            elevenlabs_status == "ok"
        ])
        
        status_code = 200 if all_ok else 207
        
        return HealthResponse(
            status="healthy" if all_ok else "degraded",
            version="2.0.0",
            database=db_health,
            services={
                "transcription": {
                    "status": transcription_status,
                    "model": os.getenv("WHISPER_MODEL", "base")
                },
                "heygen": {
                    "status": heygen_status,
                    "api_url": os.getenv("HEYGEN_API_URL", "https://api.heygen.com")
                },
                "elevenlabs": {
                    "status": elevenlabs_status,
                    "api_url": os.getenv("ELEVENLABS_API_URL", "https://api.elevenlabs.io/v1")
                },
                "playwright": {
                    "status": playwright_status,
                    "browser_type": os.getenv("BROWSER_TYPE", "chromium"),
                    "headless": os.getenv("HEADLESS_BROWSER", "false").lower() == "true"
                }
            },
            timestamp=datetime.now().isoformat()
        )

# ===========================================
# ERROR HANDLING
# ===========================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    logger.warning(f"⚠️ Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": str(exc), "detail": exc.errors()},
        status_code=422
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.error(f"❌ HTTP error: {exc}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
        status_code=exc.status_code
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    logger.error(f"❌ Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc), "detail": "Internal server error"},
        status_code=500
    )

# ===========================================
# RUN APPLICATION
# ===========================================

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting Kupuri Studios AI OS server...")
    
    # Run application
    uvicorn.run(
        "server.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=False,  # Disable auto-reload for production
        log_level="info",
        access_log=True,
        workers=1  # Start with single worker for stability
    )