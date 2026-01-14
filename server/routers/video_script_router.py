"""
Kupuri Studios - Video Generation Router
Handles video script generation and HeyGen integration
Part of the 7-Day MVP Sprint
"""

import os
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import httpx

from services.litellm_router_service import litellm_router, TaskType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video", tags=["video"])

# HeyGen Configuration
HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY")
HEYGEN_API_BASE = "https://api.heygen.com/v2"

# ElevenLabs Configuration  
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"


class GenerateScriptRequest(BaseModel):
    topic: str = Field(..., description="Topic or transcription to generate script from")
    language: str = Field(default="es", description="Language for the script (es/en)")
    duration: int = Field(default=60, description="Target video duration in seconds")
    style: str = Field(default="professional", description="Video style")
    avatar_id: Optional[str] = Field(default=None, description="HeyGen avatar ID")
    voice_id: Optional[str] = Field(default=None, description="ElevenLabs voice ID")


class GenerateScriptResponse(BaseModel):
    script: str
    title: str
    hook: str
    cta: str
    estimated_duration: int
    video_job_id: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    model_used: str
    cost_estimate: float


class VideoStatusResponse(BaseModel):
    status: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error: Optional[str] = None


# Default avatars for different use cases
DEFAULT_AVATARS = {
    "professional_male_es": "josh_lite3_20230714",
    "professional_female_es": "anna_costume1_20210906",
    "casual_male_es": "tyler_costume_20230609",
    "casual_female_es": "kristin_costume_20230403",
}

# Default voices (ElevenLabs Spanish voices)
DEFAULT_VOICES = {
    "es_female": "ThT5KcBeYPX3keUQqHPh",  # Spanish female
    "es_male": "VR6AewLTigWG4xSOukaG",    # Spanish male
    "en_female": "21m00Tcm4TlvDq8ikWAM",  # English female
    "en_male": "ErXwobaYiN019PkySvjV",    # English male
}


@router.post("/generate-script", response_model=GenerateScriptResponse)
async def generate_video_script(
    request: GenerateScriptRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate a video script from topic/transcription and optionally start video generation
    """
    try:
        # Generate script using LiteLLM router
        result = await litellm_router.generate_video_script(
            topic=request.topic,
            duration_seconds=request.duration,
            style=request.style,
            language=request.language
        )
        
        script_content = result["script"]
        
        # Parse script sections
        title = extract_section(script_content, "TITLE:", "HOOK:")
        hook = extract_section(script_content, "HOOK:", "BODY:")
        cta = extract_section(script_content, "CTA:", "FULL_SCRIPT:")
        full_script = extract_section(script_content, "FULL_SCRIPT:", None)
        
        if not full_script:
            full_script = script_content
        
        response = GenerateScriptResponse(
            script=full_script,
            title=title or "Untitled Video",
            hook=hook or "",
            cta=cta or "",
            estimated_duration=request.duration,
            model_used=result.get("model_used", "unknown"),
            cost_estimate=calculate_cost_estimate(request.duration)
        )
        
        # If HeyGen is configured, start video generation in background
        if HEYGEN_API_KEY and request.avatar_id:
            video_job_id = await start_heygen_video(
                script=full_script,
                avatar_id=request.avatar_id or get_default_avatar(request.style, request.language),
                voice_id=request.voice_id or get_default_voice(request.language),
                language=request.language
            )
            response.video_job_id = video_job_id
        
        return response
        
    except Exception as e:
        logger.error(f"Script generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{job_id}", response_model=VideoStatusResponse)
async def get_video_status(job_id: str):
    """
    Check the status of a HeyGen video generation job
    """
    if not HEYGEN_API_KEY:
        raise HTTPException(status_code=400, detail="HeyGen not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{HEYGEN_API_BASE}/video_status.get",
                params={"video_id": job_id},
                headers={"X-Api-Key": HEYGEN_API_KEY}
            )
            response.raise_for_status()
            
            data = response.json()
            status = data.get("data", {}).get("status", "unknown")
            
            return VideoStatusResponse(
                status=status,
                video_url=data.get("data", {}).get("video_url"),
                thumbnail_url=data.get("data", {}).get("thumbnail_url"),
                error=data.get("data", {}).get("error")
            )
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HeyGen status check failed: {e}")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to check video status")


@router.get("/avatars")
async def list_avatars():
    """
    List available HeyGen avatars
    """
    if not HEYGEN_API_KEY:
        return {"avatars": [], "message": "HeyGen not configured - using defaults"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{HEYGEN_API_BASE}/avatars",
                headers={"X-Api-Key": HEYGEN_API_KEY}
            )
            response.raise_for_status()
            
            data = response.json()
            return {
                "avatars": data.get("data", {}).get("avatars", []),
                "defaults": DEFAULT_AVATARS
            }
            
    except Exception as e:
        logger.error(f"Failed to list avatars: {e}")
        return {"avatars": [], "defaults": DEFAULT_AVATARS, "error": str(e)}


@router.get("/voices")
async def list_voices():
    """
    List available ElevenLabs voices
    """
    if not ELEVENLABS_API_KEY:
        return {"voices": [], "message": "ElevenLabs not configured - using defaults"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ELEVENLABS_API_BASE}/voices",
                headers={"xi-api-key": ELEVENLABS_API_KEY}
            )
            response.raise_for_status()
            
            data = response.json()
            return {
                "voices": data.get("voices", []),
                "defaults": DEFAULT_VOICES
            }
            
    except Exception as e:
        logger.error(f"Failed to list voices: {e}")
        return {"voices": [], "defaults": DEFAULT_VOICES, "error": str(e)}


async def start_heygen_video(
    script: str,
    avatar_id: str,
    voice_id: str,
    language: str = "es"
) -> Optional[str]:
    """
    Start HeyGen video generation job
    """
    if not HEYGEN_API_KEY:
        logger.warning("HeyGen API key not configured")
        return None
    
    try:
        payload = {
            "video_inputs": [{
                "character": {
                    "type": "avatar",
                    "avatar_id": avatar_id,
                    "avatar_style": "normal"
                },
                "voice": {
                    "type": "text",
                    "input_text": script,
                    "voice_id": voice_id
                },
                "background": {
                    "type": "color",
                    "value": "#1e1e2e"  # Dark background
                }
            }],
            "dimension": {
                "width": 1080,
                "height": 1920  # Vertical for social media
            },
            "test": False  # Set to True for testing
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{HEYGEN_API_BASE}/video/generate",
                json=payload,
                headers={
                    "X-Api-Key": HEYGEN_API_KEY,
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            
            data = response.json()
            video_id = data.get("data", {}).get("video_id")
            
            logger.info(f"HeyGen video job started: {video_id}")
            return video_id
            
    except Exception as e:
        logger.error(f"Failed to start HeyGen video: {e}")
        return None


def extract_section(text: str, start_marker: str, end_marker: Optional[str]) -> Optional[str]:
    """Extract a section from the generated script"""
    try:
        start_idx = text.find(start_marker)
        if start_idx == -1:
            return None
        
        start_idx += len(start_marker)
        
        if end_marker:
            end_idx = text.find(end_marker, start_idx)
            if end_idx == -1:
                return text[start_idx:].strip()
            return text[start_idx:end_idx].strip()
        else:
            return text[start_idx:].strip()
            
    except Exception:
        return None


def get_default_avatar(style: str, language: str) -> str:
    """Get default avatar based on style and language"""
    key = f"{style}_female_{language[:2]}"
    return DEFAULT_AVATARS.get(key, DEFAULT_AVATARS["professional_female_es"])


def get_default_voice(language: str) -> str:
    """Get default voice based on language"""
    lang_code = language[:2]
    return DEFAULT_VOICES.get(f"{lang_code}_female", DEFAULT_VOICES["es_female"])


def calculate_cost_estimate(duration_seconds: int) -> float:
    """
    Estimate cost for video generation
    HeyGen: ~$0.05 per second
    ElevenLabs: ~$0.01 per 100 characters
    """
    heygen_cost = duration_seconds * 0.05
    elevenlabs_cost = (duration_seconds * 15) / 100 * 0.01  # ~15 chars/second
    return round(heygen_cost + elevenlabs_cost, 2)


# Health check endpoint
@router.get("/health")
async def health_check():
    """Check video service health"""
    return {
        "status": "healthy",
        "heygen_configured": bool(HEYGEN_API_KEY),
        "elevenlabs_configured": bool(ELEVENLABS_API_KEY),
        "litellm_status": await litellm_router.health_check()
    }
