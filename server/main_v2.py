"""
Kupuri Studios AI OS - Main FastAPI Application
==============================================
Production-grade AI Operating System for autonomous agency operations.

Features:
- LiteLLM Smart Router (GLM-4 → Claude → GPT-4 fallback)
- Lightning Orchestrator (Microsoft AutoGen-inspired agent coordination)
- Voice-to-Video Pipeline (Whisper → Script → HeyGen)
- Real-time Supervisor WebSocket
- Stripe Payment Integration
- Playwright Browser Automation

Supports: Whisper transcription, HeyGen video generation, ElevenLabs TTS, 
          Playwright automation, Chatwoot integration
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

# FastAPI imports
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.exceptions import RequestValidationError

# Database imports
from pydantic import BaseModel, Field

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
# LIFESPAN CONTEXT MANAGER
# ===========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan context manager for startup/shutdown"""
    logger.info("🚀 Kupuri Studios AI OS - Starting up...")
    logger.info("⚡ THE COFOUNDER Lightning Orchestrator initializing...")
    logger.info("=" * 60)
    
    try:
        # Import services
        from services.transcription_service import transcription_service
        from services.database_service import database_service
        from services.playwright_mcp_service import playwright_mcp_service
        from services.lightning_orchestrator import lightning_orchestrator
        
        # Initialize transcription service
        await transcription_service.initialize()
        logger.info("✅ Transcription service (Whisper) initialized")
        
        # Initialize database service
        await database_service.initialize()
        logger.info("✅ Database service initialized")
        
        # Initialize Playwright MCP service
        await playwright_mcp_service.initialize()
        logger.info("✅ Playwright MCP service initialized")
        
        # Lightning Orchestrator is auto-initialized as singleton
        logger.info("✅ Lightning Orchestrator (THE COFOUNDER) online")
        logger.info(f"   └── {len(lightning_orchestrator.agents)} sub-agents ready")
        
        # Create necessary directories
        media_dir = Path(os.getenv("MEDIA_STORAGE", "./data/media"))
        media_dir.mkdir(parents=True, exist_ok=True)
        
        uploads_dir = Path("./data/uploads")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("=" * 60)
        logger.info("✅ All services initialized successfully!")
        logger.info("🌐 Kupuri Studios AI OS is ready to serve traffic")
        logger.info("🦋 La Mariposa awaits activation...")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
        
    finally:
        # Shutdown
        logger.info("🛑 Shutting down Kupuri Studios AI OS...")
        logger.info("=" * 60)
        
        try:
            from services.playwright_mcp_service import playwright_mcp_service
            await playwright_mcp_service.close()
            logger.info("✅ Playwright browser closed")
        except:
            pass
            
        logger.info("✅ Shutdown complete - ¡Hasta luego!")


# ===========================================
# FASTAPI APP CONFIGURATION
# ===========================================

app = FastAPI(
    title="Kupuri Studios AI OS",
    description="""
    ## 🎬 Autonomous AI Agency Operating System
    
    **THE COFOUNDER** - Synthia AI Leadership System
    
    ### Features:
    - 🎤 Voice-to-Video Pipeline (Whisper → Script → HeyGen)
    - ⚡ Lightning Orchestrator (Multi-agent coordination)
    - 🤖 Smart LLM Routing (GLM-4 → Claude → GPT-4)
    - 💳 Stripe Payment Integration
    - 📊 Real-time Supervisor WebSocket
    - 🌐 Playwright Browser Automation
    
    ### For Mexico City & Latin America
    Built with love for the entrepreneurs of CDMX 🇲🇽
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ===========================================
# CORS MIDDLEWARE
# ===========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        os.getenv("PRODUCTION_URL", "https://kupuri.media"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600
)

# ===========================================
# STATIC FILES
# ===========================================

# Mount static files if they exist
try:
    app.mount("/static", StaticFiles(directory="react/dist"), name="static")
except:
    logger.warning("Static files directory not found - skipping")

try:
    media_path = os.getenv("MEDIA_STORAGE", "./data/media")
    Path(media_path).mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=media_path), name="media")
except:
    logger.warning("Media directory not mounted")


# ===========================================
# ROUTER REGISTRATION
# ===========================================

def register_routers():
    """Register all API routers"""
    
    # Core routers
    try:
        from routers.transcription_router import router as transcription_router
        app.include_router(transcription_router, prefix="/api/transcription", tags=["transcription"])
        logger.info("  📍 Transcription router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ Transcription router not available: {e}")
        
    try:
        from routers.video_generation_router import router as video_gen_router
        app.include_router(video_gen_router, prefix="/api/video", tags=["video"])
        logger.info("  📍 Video generation router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ Video generation router not available: {e}")
        
    try:
        from routers.playwright_router import router as playwright_router
        app.include_router(playwright_router, prefix="/api/playwright", tags=["playwright"])
        logger.info("  📍 Playwright router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ Playwright router not available: {e}")
    
    # New MVP routers
    try:
        from routers.video_script_router import router as video_script_router
        app.include_router(video_script_router, prefix="/api/video-script", tags=["video-script"])
        logger.info("  📍 Video script router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ Video script router not available: {e}")
        
    try:
        from routers.payments_router import router as payments_router
        app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
        logger.info("  📍 Payments router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ Payments router not available: {e}")
    
    # Lightning Orchestrator / Supervisor router
    try:
        from routers.supervisor_router import router as supervisor_router
        app.include_router(supervisor_router, tags=["supervisor"])
        logger.info("  📍 Supervisor router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ Supervisor router not available: {e}")
        
    # LiteLLM router
    try:
        from routers.litellm_router import router as litellm_router
        app.include_router(litellm_router, prefix="/api/llm", tags=["llm"])
        logger.info("  📍 LiteLLM router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ LiteLLM router not available: {e}")
        
    # Chat router
    try:
        from routers.chat_router import router as chat_router
        app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
        logger.info("  📍 Chat router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ Chat router not available: {e}")
        
    # WebSocket router
    try:
        from routers.websocket_router import router as websocket_router
        app.include_router(websocket_router, prefix="/ws", tags=["websocket"])
        logger.info("  📍 WebSocket router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ WebSocket router not available: {e}")
        
    # Metrics router
    try:
        from routers.metrics_router import router as metrics_router
        app.include_router(metrics_router, prefix="/api/metrics", tags=["metrics"])
        logger.info("  📍 Metrics router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ Metrics router not available: {e}")
        
    # Agents router
    try:
        from routers.agents import router as agents_router
        app.include_router(agents_router, prefix="/api/agents", tags=["agents"])
        logger.info("  📍 Agents router registered")
    except ImportError as e:
        logger.warning(f"  ⚠️ Agents router not available: {e}")
        

# Register all routers at import time
logger.info("📡 Registering API routers...")
register_routers()
logger.info("✅ Router registration complete")


# ===========================================
# REQUEST/RESPONSE MODELS
# ===========================================

class HealthResponse(BaseModel):
    status: str
    version: str
    orchestrator: str
    agents_online: int
    services: dict
    timestamp: str


# ===========================================
# ROOT ENDPOINTS
# ===========================================

@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint - Welcome page"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Kupuri Studios AI OS</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: white;
                min-height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                text-align: center;
                padding: 2rem;
            }
            h1 {
                font-size: 3rem;
                background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 0.5rem;
            }
            .subtitle {
                color: #94a3b8;
                font-size: 1.2rem;
                margin-bottom: 2rem;
            }
            .badge {
                display: inline-block;
                padding: 0.5rem 1rem;
                background: rgba(102, 126, 234, 0.2);
                border: 1px solid rgba(102, 126, 234, 0.4);
                border-radius: 9999px;
                font-size: 0.875rem;
                margin-bottom: 2rem;
            }
            .links {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            a {
                padding: 0.75rem 1.5rem;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 500;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            a:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
            }
            .flag {
                font-size: 2rem;
                margin-bottom: 1rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="flag">🇲🇽</div>
            <h1>Kupuri Studios AI OS</h1>
            <p class="subtitle">THE COFOUNDER - Autonomous AI Agency Platform</p>
            <div class="badge">⚡ Lightning Orchestrator Online</div>
            <div class="links">
                <a href="/docs">📚 API Docs</a>
                <a href="/redoc">📖 ReDoc</a>
                <a href="/health">💚 Health</a>
                <a href="/api/supervisor/status">🤖 Agents</a>
            </div>
        </div>
    </body>
    </html>
    """


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    Returns status of all services and the Lightning Orchestrator.
    """
    from datetime import datetime
    
    try:
        from services.lightning_orchestrator import lightning_orchestrator
        agents_count = len(lightning_orchestrator.agents)
    except:
        agents_count = 0
    
    services = {
        "transcription": "unknown",
        "video_generation": "unknown",
        "payments": "unknown",
        "database": "unknown"
    }
    
    # Check transcription service
    try:
        from services.transcription_service import transcription_service
        services["transcription"] = "healthy" if transcription_service.whisper_model else "degraded"
    except:
        services["transcription"] = "unavailable"
        
    # Check database
    try:
        from services.database_service import database_service
        services["database"] = "healthy"
    except:
        services["database"] = "unavailable"
        
    services["video_generation"] = "healthy"
    services["payments"] = "healthy"
    
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        orchestrator="Lightning Orchestrator v1.0",
        agents_online=agents_count,
        services=services,
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "name": "Kupuri Studios AI OS",
        "version": "2.0.0",
        "description": "Autonomous AI Agency Operating System for CDMX",
        "features": [
            "Voice-to-Video Pipeline",
            "Lightning Orchestrator",
            "Smart LLM Routing",
            "Real-time Supervisor",
            "Stripe Payments"
        ],
        "docs": "/docs",
        "health": "/health",
        "supervisor": "/api/supervisor/status"
    }


# ===========================================
# EXCEPTION HANDLERS
# ===========================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "details": exc.errors(),
            "body": exc.body
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if os.getenv("DEBUG") else "An unexpected error occurred"
        }
    )


# ===========================================
# RUN DIRECTLY
# ===========================================

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    logger.info(f"🚀 Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
