"""
Video Generation API Router
Provides endpoints for AI avatar and video generation
Integrates with HeyGen and ElevenLabs services
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from services.heygen_service import heygen_service
from services.elevenlabs_service import elevenlabs_service
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/video",
    tags=["video_generation"]
)

# Request Models
class GenerateAvatarRequest(BaseModel):
    script: str
    avatar_id: Optional[str] = None
    voice_id: Optional[str] = None
    template_id: Optional[str] = None
    test: bool = False

class GenerateSpeechRequest(BaseModel):
    text: str
    voice_id: str
    model: Optional[str] = None
    stability: float = 0.5
    similarity_boost: float = 0.75

class GetAvatarsRequest(BaseModel):
    limit: int = 20

class GetVoicesRequest(BaseModel):
    limit: int = 50

@router.post("/generate-avatar")
async def generate_avatar_video(request: GenerateAvatarRequest):
    """
    Generate AI avatar video using HeyGen
    
    Request:
        GenerateAvatarRequest with script, avatar ID, voice ID
    
    Returns:
        Dictionary with video URL and metadata
    """
    try:
        logger.info(f"Generating avatar video with script length: {len(request.script)}")
        
        result = await heygen_service.generate_avatar_video(
            script=request.script,
            avatar_id=request.avatar_id,
            voice_id=request.voice_id,
            template_id=request.template_id,
            test=request.test
        )
        
        if result.get("success"):
            return {
                "success": True,
                "video_id": result.get("video_id"),
                "video_url": result.get("video_url"),
                "duration": result.get("duration"),
                "script": request.script,
                "avatar_id": request.avatar_id,
                "voice_id": request.voice_id,
                "status": result.get("status"),
                "created_at": result.get("created_at")
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate avatar video")
    
    except Exception as e:
        logger.error(f"❌ Error generating avatar video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-speech")
async def generate_audio_from_text(request: GenerateSpeechRequest):
    """
    Generate speech audio from text using ElevenLabs
    
    Request:
        GenerateSpeechRequest with text, voice ID
    
    Returns:
        Dictionary with audio data
    """
    try:
        logger.info(f"Generating speech with text length: {len(request.text)}")
        
        result = await elevenlabs_service.generate_speech(
            text=request.text,
            voice_id=request.voice_id,
            model=request.model,
            stability=request.stability,
            similarity_boost=request.similarity_boost
        )
        
        if result.get("success"):
            return {
                "success": True,
                "audio_base64": result.get("audio") if isinstance(result.get("audio"), str) else None,
                "content_type": result.get("content_type"),
                "model": result.get("model"),
                "text": request.text,
                "voice_id": request.voice_id,
                "status": "completed"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate speech audio")
    
    except Exception as e:
        logger.error(f"❌ Error generating speech audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/avatars")
async def get_available_avatars(request: GetAvatarsRequest):
    """
    Get list of available HeyGen avatars
    
    Request:
        GetAvatarsRequest with optional limit
    
    Returns:
        List of avatar dictionaries
    """
    try:
        logger.info(f"Fetching available avatars (limit: {request.limit})")
        
        avatars = await heygen_service.list_avatars()
        
        return {
            "success": True,
            "avatars": avatars,
            "count": len(avatars)
        }
    
    except Exception as e:
        logger.error(f"❌ Error fetching avatars: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/voices")
async def get_available_voices(request: GetVoicesRequest):
    """
    Get list of available ElevenLabs voices
    
    Request:
        GetVoicesRequest with optional limit
    
    Returns:
        List of voice dictionaries
    """
    try:
        logger.info(f"Fetching available voices (limit: {request.limit})")
        
        voices = await elevenlabs_service.get_available_voices()
        
        return {
            "success": True,
            "voices": voices,
            "count": len(voices)
        }
    
    except Exception as e:
        logger.error(f"❌ Error fetching voices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """
    Health check endpoint for video generation service
    
    Returns:
        Service health status
    """
    try:
        return {
            "service": "video_generation",
            "status": "healthy",
            "dependencies": {
                "heygen": "ok" if heygen_service else "not_configured",
                "elevenlabs": "ok" if elevenlabs_service else "not_configured"
            },
            "timestamp": "2026-01-13T12:00:00Z"
        }
    
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return {
            "service": "video_generation",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2026-01-13T12:00:00Z"
        }