"""
ElevenLabs Service - Text-to-Speech
Generates audio from text using ElevenLabs API
Supports voice cloning and audio history management
"""

import os
import requests
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ElevenLabsService:
    """Service for generating speech from text using ElevenLabs API"""
    
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.api_url = os.getenv("ELEVENLABS_API_URL", "https://api.elevenlabs.io/v1")
        self.default_model = os.getenv("ELEVENLABS_DEFAULT_MODEL", "eleven_multilingual_v2")
    
    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        model: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        output_format: str = "mp3_22050_2"
    ) -> Dict:
        """
        Generate speech from text
        
        Args:
            text: Text to convert to speech
            voice_id: ElevenLabs voice ID
            model: Voice model to use
            stability: Speech stability (0.0 to 1.0)
            similarity_boost: Voice similarity to target (0.0 to 1.0)
            output_format: Output format ('mp3_22050_2', 'pcm_16000', etc.)
            
        Returns:
            Dict with audio data and content type
        """
        try:
            # Use default model if not specified
            model = model or self.default_model
            
            logger.info(f"Generating speech with voice: {voice_id}, model: {model}")
            
            # Prepare request
            payload = {
                "text": text,
                "model_id": model,
                "voice_settings": {
                    "stability": stability,
                    "similarity_boost": similarity_boost
                }
            }
            
            # Call ElevenLabs API
            response = requests.post(
                f"{self.api_url}/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg"
                },
                json=payload,
                timeout=60
            )
            
            response.raise_for_status()
            
            return {
                "success": True,
                "audio": response.content,
                "content_type": "audio/mpeg",
                "model": model,
                "text": text,
                "voice_id": voice_id
            }
            
        except requests.HTTPError as e:
            logger.error(f"❌ ElevenLabs HTTP error: {e}")
            raise Exception(f"ElevenLabs API error: {e}")
        except Exception as e:
            logger.error(f"❌ ElevenLabs error: {e}")
            raise Exception(f"Failed to generate speech: {e}")
    
    async def get_available_voices(self) -> List[Dict]:
        """
        List available voices from ElevenLabs
        
        Returns:
            List of voice dictionaries with metadata
        """
        try:
            logger.info("Fetching available voices from ElevenLabs...")
            
            response = requests.get(
                f"{self.api_url}/voices",
                headers={
                    "xi-api-key": self.api_key
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            voices = result.get("voices", [])
            
            logger.info(f"✅ Found {len(voices)} available voices")
            
            return voices
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch voices: {e}")
            raise Exception(f"Failed to fetch voices: {e}")
    
    async def get_voice_details(self, voice_id: str) -> Dict:
        """
        Get detailed information about a specific voice
        
        Args:
            voice_id: Voice ID to fetch details for
            
        Returns:
            Dictionary with voice metadata
        """
        try:
            logger.info(f"Fetching voice details: {voice_id}")
            
            response = requests.get(
                f"{self.api_url}/voices/{voice_id}",
                headers={
                    "xi-api-key": self.api_key
                },
                timeout=10
            )
            
            response.raise_for_status()
            result = response.json()
            
            voice_data = result
            
            logger.info(f"✅ Fetched voice details: {voice_data.get('name', voice_id)}")
            
            return voice_data
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch voice details: {e}")
            raise Exception(f"Failed to fetch voice details: {e}")
    
    async def clone_voice(
        self,
        name: str,
        audio_file_path: str,
        description: str = "",
        labels: List[str] = []
    ) -> Dict:
        """
        Clone a voice from audio file
        
        Args:
            name: Name for the cloned voice
            audio_file_path: Path to audio file to clone from
            description: Optional description
            labels: Optional list of labels
            
        Returns:
            Dictionary with new voice ID and metadata
        """
        try:
            logger.info(f"Cloning voice: {name}")
            
            # Prepare request
            files = {
                "files": [{
                    "name": name,
                    "description": description,
                    "labels": labels
                }]
            }
            
            # Open audio file
            with open(audio_file_path, 'rb') as audio_file:
                # Add audio file to form data
                files["files"][0]["files"] = [{
                    "name": name,
                    "data": audio_file.read()
                }]
            
            response = requests.post(
                f"{self.api_url}/voices/add",
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "multipart/form-data"
                },
                data=files,
                timeout=120
            )
            
            response.raise_for_status()
            result = response.json()
            
            voice_id = result.get("voice_id")
            
            logger.info(f"✅ Voice cloned successfully: {voice_id}")
            
            return {
                "success": True,
                "voice_id": voice_id,
                "name": name,
                "description": description,
                "labels": labels
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to clone voice: {e}")
            raise Exception(f"Failed to clone voice: {e}")
    
    async def get_audio_history(self, limit: int = 100) -> List[Dict]:
        """
        Get audio generation history
        
        Args:
            limit: Maximum number of history items to fetch
            
        Returns:
            List of audio generation items
        """
        try:
            logger.info("Fetching audio history...")
            
            response = requests.get(
                f"{self.api_url}/history",
                headers={
                    "xi-api-key": self.api_key,
                    "Accept": "application/json"
                },
                params={
                    "limit": limit
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            history_items = result.get("history", [])
            
            logger.info(f"✅ Fetched {len(history_items)} history items")
            
            return history_items
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch audio history: {e}")
            raise Exception(f"Failed to fetch audio history: {e}")

# Global service instance
elevenlabs_service = ElevenLabsService()