"""
Transcription API Router
Provides endpoints for video/audio transcription using Whisper
Integrates with transcription_service for actual processing
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Dict
from services.transcription_service import transcription_service

# Create router
router = APIRouter(
    prefix="/api/transcription",
    tags=["transcription"]
)

@router.post("/upload")
async def upload_and_transcribe(file: UploadFile = File(...), language: str = "en", detect_speakers: bool = True):
    """
    Upload file and transcribe it
    
    Args:
        file: Video/audio file to transcribe
        language: Language code (en, es, fr, auto, etc.)
        detect_speakers: Whether to detect different speakers
        
    Returns:
        Transcription result with text and segments
    """
    try:
        # Save uploaded file
        from pathlib import Path
        import os
        import uuid
        
        # Generate unique filename
        file_ext = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Create media directory if it doesn't exist
        media_dir = Path(os.getenv("MEDIA_STORAGE", "/app/data/media"))
        media_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = media_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Transcribe the file
        result = await transcription_service.transcribe_file(
            str(file_path),
            language=language,
            detect_speakers=detect_speakers
        )
        
        return {
            "success": result["status"] == "completed",
            "transcription": result,
            "file_path": str(file_path),
            "file_name": unique_filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/file")
async def transcribe_existing_file(file_path: str, language: str = "en", detect_speakers: bool = True):
    """
    Transcribe an already uploaded file
    
    Args:
        file_path: Path to existing file
        language: Language code
        detect_speakers: Whether to detect different speakers
        
    Returns:
        Transcription result
    """
    try:
        result = await transcription_service.transcribe_file(
            file_path,
            language=language,
            detect_speakers=detect_speakers
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{file_path:path}")
async def get_transcription_status(file_path: str):
    """
    Get status of an existing transcription
    
    Args:
        file_path: Path to original media file
        
    Returns:
        Status information about existing transcription
    """
    try:
        from pathlib import Path
        import os
        
        # Get transcription status from service
        result = await transcription_service.get_transcription_status(file_path)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export-srt")
async def export_to_srt(file_path: str, output_path: str = None):
    """
    Export transcription to SRT format
    
    Args:
        file_path: Path to original media file
        output_path: Optional output path (auto-generated if not provided)
        
    Returns:
        Success status and SRT file path
    """
    try:
        from pathlib import Path
        import os
        
        # Load transcription
        transcript_file = file_path.rsplit('.', 1)[0] + '_transcript.json'
        
        if not Path(transcript_file).exists():
            raise HTTPException(status_code=404, detail="Transcript not found")
        
        import json
        with open(transcript_file, 'r') as f:
            transcription = json.load(f)
        
        # Generate output path if not provided
        if output_path is None:
            output_path = file_path.rsplit('.', 1)[0] + '.srt'
        
        # Export to SRT
        srt_content = await transcription_service.export_to_srt(transcription, output_path)
        
        return {
            "success": True,
            "srt_file": output_path,
            "srt_content": srt_content
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))