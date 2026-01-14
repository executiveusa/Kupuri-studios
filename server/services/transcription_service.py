"""
Transcription Service - OpenAI Whisper Integration
Converts video/audio files to text using OpenAI Whisper model
Supports speaker detection and language specification
"""

import os
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
import tempfile
import asyncio
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranscriptionService:
    """Service for transcribing video/audio files using OpenAI Whisper"""
    
    def __init__(self):
        self.whisper_model = os.getenv("WHISPER_MODEL", "base")
        self.whisper_device = os.getenv("WHISPER_DEVICE", "cpu")
        self.model = None
    
    async def initialize(self):
        """Initialize Whisper model on startup"""
        try:
            logger.info(f"Loading Whisper model: {self.whisper_model}")
            # Import whisper - will be installed via openai-whisper package
            import whisper
            self.model = whisper.load_model(
                self.whisper_model,
                device=self.whisper_device
            )
            logger.info("✅ Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load Whisper model: {e}")
            # Set model to None so we can handle gracefully
            self.model = None
    
    async def transcribe_file(
        self,
        file_path: str,
        language: Optional[str] = None,
        detect_speakers: bool = True,
        word_timestamps: bool = True
        output_format: str = "json"
    ) -> Dict:
        """
        Transcribe video/audio file using OpenAI Whisper
        
        Args:
            file_path: Path to video/audio file
            language: Language code (e.g., 'en', 'es', 'fr', 'auto')
            detect_speakers: Whether to detect different speakers
            word_timestamps: Whether to include word-level timestamps
            output_format: Output format ('json', 'srt', 'txt', 'vtt')
            
        Returns:
            Dict containing transcription result with segments and metadata
        """
        try:
            if self.model is None:
                await self.initialize()
            
            if self.model is None:
                raise Exception("Whisper model not available. Please check installation.")
            
            logger.info(f"Starting transcription for: {file_path}")
            
            # Check if file exists
            if not Path(file_path).exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Extract audio from video file if needed
            audio_path = await self._extract_audio(file_path)
            
            # Transcribe with Whisper
            logger.info("Running Whisper transcription...")
            result = self.model.transcribe(
                audio_path,
                language=language,
                word_timestamps=word_timestamps,
                vad_filter=True
            )
            
            # Process segments
            segments = []
            for segment in result["segments"]:
                segments.append({
                    "start": segment["start"],
                    "end": segment["end"],
                    "text": segment["text"],
                    "words": segment.get("words", []),
                    "speaker": segment.get("speaker", None)
                })
            
            # Detect speakers if enabled
            speakers = []
            if detect_speakers:
                speakers = await self._detect_speakers(segments)
            
            # Build response
            response = {
                "text": result["text"],
                "language": result["language"],
                "segments": segments,
                "speakers": speakers,
                "duration": result.get("duration", 0),
                "file_path": file_path,
                "audio_path": audio_path,
                "status": "completed"
            }
            
            # Clean up temporary audio file
            if audio_path != file_path:
                try:
                    Path(audio_path).unlink(missing_ok=True)
                    logger.info(f"Cleaned temporary audio file: {audio_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean temporary audio file: {e}")
            
            logger.info(f"✅ Transcription completed: {len(result['text'])} characters")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Transcription failed for {file_path}: {e}")
            return {
                "text": "",
                "segments": [],
                "speakers": [],
                "error": str(e),
                "status": "failed"
            }
    
    async def _extract_audio(self, file_path: str) -> str:
        """
        Extract audio from video file using ffmpeg
        
        Args:
            file_path: Path to video file
            
        Returns:
            Path to extracted audio file
        """
        try:
            # Generate audio path
            audio_path = file_path.rsplit('.', 1)[0] + '_temp.wav'
            
            # Check if file is already audio
            file_ext = Path(file_path).suffix.lower()
            if file_ext in ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac']:
                logger.info(f"File is already audio format, skipping extraction: {file_path}")
                return file_path
            
            # Build ffmpeg command
            cmd = [
                'ffmpeg',
                '-i', file_path,
                '-vn',  # No video
                '-acodec', 'pcm_s16le',  # 16-bit PCM
                '-ar', '16000',  # 16kHz sample rate
                '-ac', '1',  # Mono
                audio_path,
                '-y'  # Overwrite
            ]
            
            logger.info(f"Extracting audio with ffmpeg...")
            subprocess.run(
                cmd,
                check=True,
                capture_output=True,
                text=True
            )
            
            logger.info(f"✅ Audio extracted: {audio_path}")
            return audio_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ FFmpeg extraction failed: {e}")
            raise Exception(f"Audio extraction failed: {e}")
        except Exception as e:
            logger.error(f"❌ Unexpected error during audio extraction: {e}")
            raise Exception(f"Audio extraction failed: {e}")
    
    async def _detect_speakers(self, segments: List[Dict]) -> List[Dict]:
        """
        Detect different speakers using heuristic clustering
        
        Args:
            segments: List of transcript segments
            
        Returns:
            List of detected speakers with metadata
        """
        try:
            speakers = []
            current_speaker_id = 0
            speaker_changes = 0
            
            # Simple heuristic: speaker change if gap > 2 seconds
            for i, segment in enumerate(segments):
                if i > 0:
                    gap = segment["start"] - segments[i-1]["end"]
                    if gap > 2.0:
                        current_speaker_id += 1
                        speaker_changes += 1
                
                segment["speaker"] = current_speaker_id
            
            # Collect speaker segments for each speaker
            speaker_segments = {}
            for speaker_id in set([s["speaker"] for s in segments]):
                speaker_segments[speaker_id] = [s for s in segments if s["speaker"] == speaker_id]
            
            # Create speaker metadata
            for speaker_id, segments in speaker_segments.items():
                total_duration = sum(s["end"] - s["start"] for s in segments)
                speaker = {
                    "id": speaker_id,
                    "name": f"Speaker {speaker_id + 1}",
                    "segments": len(segments),
                    "duration": round(total_duration, 2),
                    "word_count": sum(len(s.get("words", [])) for s in segments)
                }
                speakers.append(speaker)
            
            logger.info(f"✅ Detected {len(speakers)} speakers")
            
            return speakers
            
        except Exception as e:
            logger.error(f"❌ Speaker detection failed: {e}")
            return []
    
    async def export_to_srt(
        self,
        transcription: Dict,
        output_path: str
        max_characters_per_line: int = 42
        max_lines: int = 2
    ) -> str:
        """
        Export transcription to SRT format
        
        Args:
            transcription: Transcription result dictionary
            output_path: Path to output SRT file
            max_characters_per_line: Maximum characters per line
            max_lines: Maximum lines per subtitle
            
        Returns:
            SRT content string
        """
        try:
            lines = []
            current_line = ""
            line_number = 1
            time_offset = 0.0
            
            for segment in transcription.get("segments", []):
                text = segment["text"].strip()
                start_time = segment["start"]
                end_time = segment["end"]
                duration = end_time - start_time
                
                # Start timestamp in SRT format (HH:MM:SS,mmm)
                hours = int(start_time // 3600)
                minutes = int((start_time % 3600) // 60)
                seconds = start_time % 60
                start_timestamp = f"{hours:02d}:{minutes:02d}:{seconds:06.3f}"
                
                # Add timestamp
                if current_line:
                    lines.append(current_line)
                    current_line = ""
                
                lines.append(f"{line_number}")
                lines.append(start_timestamp)
                line_number += 1
                
                # Add text
                words = text.split()
                current_words = []
                
                for word in words:
                    if len(" ".join(current_words)) + len(word) > max_characters_per_line:
                        lines.append(" ".join(current_words))
                        current_words = [word]
                        lines.append(f"{line_number}")
                        line_number += 1
                    else:
                        current_words.append(word)
                
                if current_words:
                    lines.append(" ".join(current_words))
                    line_number += 1
                
                # End timestamp
                end_hours = int(end_time // 3600)
                end_minutes = int((end_time % 3600) // 60)
                end_seconds = end_time % 60
                end_timestamp = f"{end_hours:02d}:{end_minutes:02d}:{end_seconds:06.3f}"
                
                lines.append("")
                lines.append(end_timestamp)
                line_number += 1
                lines.append("")
                
                time_offset += duration
            
            # Write to file
            srt_content = "\n".join(lines)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(srt_content)
            
            logger.info(f"✅ SRT exported to: {output_path}")
            return srt_content
            
        except Exception as e:
            logger.error(f"❌ SRT export failed: {e}")
            raise
    
    async def get_transcription_status(self, file_path: str) -> Dict:
        """
        Get status of an existing transcription
        
        Args:
            file_path: Path to original media file
            
        Returns:
            Status dictionary
        """
        # Check for transcript files
        transcript_file = file_path.rsplit('.', 1)[0] + '_transcript.json'
        srt_file = file_path.rsplit('.', 1)[0] + '.srt'
        
        has_transcript_json = Path(transcript_file).exists()
        has_srt = Path(srt_file).exists()
        
        return {
            "file_path": file_path,
            "has_transcript": has_transcript_json or has_srt,
            "transcript_json_exists": has_transcript_json,
            "srt_exists": has_srt,
            "transcript_file": transcript_file if has_transcript_json else None,
            "srt_file": srt_file if has_srt else None
        }

# Global service instance
transcription_service = TranscriptionService()