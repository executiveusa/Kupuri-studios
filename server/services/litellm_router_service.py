"""
Kupuri Studios - LiteLLM Smart Router Service
Automatic model switching for optimal cost/performance
Self-hosted on Coolify (Hostinger VPS)
"""

import os
import asyncio
from typing import Optional, Dict, Any, List
from enum import Enum
import logging
import httpx

logger = logging.getLogger(__name__)

class TaskType(Enum):
    """Task types for intelligent routing"""
    UI_INTERACTION = "ui"
    SIMPLE_CHAT = "simple"
    CODE_GENERATION = "code"
    COMPLEX_REASONING = "reasoning"
    CREATIVE_WRITING = "creative"
    TRANSLATION = "translation"
    SUMMARIZATION = "summary"
    FUNCTION_CALLING = "function"
    TRANSCRIPTION = "transcription"
    IMAGE_GENERATION = "image"
    VIDEO_SCRIPT = "video_script"


class ModelConfig:
    """Model configurations with costs and capabilities"""
    
    MODELS = {
        "glm-4.7": {
            "provider": "openai",  # OpenAI-compatible endpoint
            "api_base": os.getenv("GLM_API_BASE", "http://localhost:4000/v1"),
            "api_key": os.getenv("GLM_API_KEY", "sk-local"),
            "cost_per_1k_input": 0.0,  # Self-hosted
            "cost_per_1k_output": 0.0,
            "max_tokens": 8192,
            "supports_functions": False,
            "supports_vision": False,
            "languages": ["en", "es", "zh"],
            "speed": "fast",
            "quality": "good",
        },
        "claude-opus-4.5": {
            "provider": "anthropic",
            "api_key": os.getenv("ANTHROPIC_API_KEY"),
            "cost_per_1k_input": 0.015,
            "cost_per_1k_output": 0.075,
            "max_tokens": 200000,
            "supports_functions": True,
            "supports_vision": True,
            "languages": ["en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"],
            "speed": "medium",
            "quality": "excellent",
        },
        "gpt-4-turbo": {
            "provider": "openai",
            "api_key": os.getenv("OPENAI_API_KEY"),
            "cost_per_1k_input": 0.01,
            "cost_per_1k_output": 0.03,
            "max_tokens": 128000,
            "supports_functions": True,
            "supports_vision": True,
            "languages": ["en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"],
            "speed": "medium",
            "quality": "excellent",
        },
        "gpt-4o-mini": {
            "provider": "openai",
            "api_key": os.getenv("OPENAI_API_KEY"),
            "cost_per_1k_input": 0.00015,
            "cost_per_1k_output": 0.0006,
            "max_tokens": 128000,
            "supports_functions": True,
            "supports_vision": True,
            "languages": ["en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"],
            "speed": "fast",
            "quality": "good",
        },
    }
    
    # Routing rules: task_type -> preferred models (in order)
    ROUTING_RULES = {
        TaskType.UI_INTERACTION: ["glm-4.7", "gpt-4o-mini"],
        TaskType.SIMPLE_CHAT: ["glm-4.7", "gpt-4o-mini"],
        TaskType.CODE_GENERATION: ["claude-opus-4.5", "gpt-4-turbo"],
        TaskType.COMPLEX_REASONING: ["claude-opus-4.5", "gpt-4-turbo"],
        TaskType.CREATIVE_WRITING: ["claude-opus-4.5", "gpt-4-turbo"],
        TaskType.TRANSLATION: ["glm-4.7", "gpt-4o-mini", "claude-opus-4.5"],
        TaskType.SUMMARIZATION: ["glm-4.7", "gpt-4o-mini"],
        TaskType.FUNCTION_CALLING: ["gpt-4-turbo", "claude-opus-4.5"],
        TaskType.TRANSCRIPTION: ["whisper-local"],  # Handled separately
        TaskType.IMAGE_GENERATION: ["dalle-3"],  # Handled separately
        TaskType.VIDEO_SCRIPT: ["claude-opus-4.5", "gpt-4-turbo"],
    }


class LiteLLMRouterService:
    """
    Smart LLM routing service using LiteLLM
    Automatically selects best model based on task type and cost
    """
    
    def __init__(self):
        self.litellm_base_url = os.getenv("LITELLM_BASE_URL", "http://localhost:4000")
        self.litellm_api_key = os.getenv("LITELLM_API_KEY", "sk-1234")
        self.fallback_enabled = True
        self.cost_tracking = {}
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.litellm_base_url,
                headers={"Authorization": f"Bearer {self.litellm_api_key}"},
                timeout=60.0
            )
        return self._client
    
    def detect_task_type(self, prompt: str, context: Optional[Dict] = None) -> TaskType:
        """
        Automatically detect task type from prompt content
        """
        prompt_lower = prompt.lower()
        
        # Code-related keywords
        if any(kw in prompt_lower for kw in ["code", "function", "class", "debug", "fix", "implement", "refactor"]):
            return TaskType.CODE_GENERATION
        
        # Reasoning keywords
        if any(kw in prompt_lower for kw in ["analyze", "explain", "why", "compare", "evaluate", "reason"]):
            return TaskType.COMPLEX_REASONING
        
        # Creative keywords
        if any(kw in prompt_lower for kw in ["write", "story", "creative", "poem", "script", "dialogue"]):
            return TaskType.CREATIVE_WRITING
        
        # Video script keywords
        if any(kw in prompt_lower for kw in ["video", "script", "scene", "narration", "voiceover"]):
            return TaskType.VIDEO_SCRIPT
        
        # Translation keywords
        if any(kw in prompt_lower for kw in ["translate", "traducir", "translation", "traducción"]):
            return TaskType.TRANSLATION
        
        # Summary keywords
        if any(kw in prompt_lower for kw in ["summarize", "summary", "tldr", "brief", "resumen"]):
            return TaskType.SUMMARIZATION
        
        # Function calling context
        if context and context.get("functions") or context.get("tools"):
            return TaskType.FUNCTION_CALLING
        
        # Default to simple chat
        return TaskType.SIMPLE_CHAT
    
    def select_model(
        self, 
        task_type: TaskType, 
        prefer_cost: bool = True,
        require_functions: bool = False,
        require_vision: bool = False,
        language: str = "en"
    ) -> str:
        """
        Select optimal model based on task requirements
        """
        candidates = ModelConfig.ROUTING_RULES.get(task_type, ["gpt-4o-mini"])
        
        for model_name in candidates:
            if model_name not in ModelConfig.MODELS:
                continue
                
            model = ModelConfig.MODELS[model_name]
            
            # Check function calling requirement
            if require_functions and not model.get("supports_functions", False):
                continue
            
            # Check vision requirement
            if require_vision and not model.get("supports_vision", False):
                continue
            
            # Check language support
            if language not in model.get("languages", ["en"]):
                continue
            
            # Check if API key is configured
            if model.get("api_key") is None and model.get("provider") != "openai":
                continue
            
            return model_name
        
        # Fallback to GPT-4o-mini (always available)
        return "gpt-4o-mini"
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        task_type: Optional[TaskType] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        functions: Optional[List[Dict]] = None,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send chat completion request through LiteLLM router
        """
        # Auto-detect task type if not provided
        if task_type is None and model is None:
            last_user_message = next(
                (m["content"] for m in reversed(messages) if m["role"] == "user"),
                ""
            )
            task_type = self.detect_task_type(
                last_user_message, 
                {"functions": functions}
            )
        
        # Select model if not specified
        if model is None:
            model = self.select_model(
                task_type,
                require_functions=functions is not None,
            )
        
        logger.info(f"LiteLLM routing: task={task_type}, model={model}")
        
        # Build request payload
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
        
        if functions:
            payload["functions"] = functions
        
        payload.update(kwargs)
        
        try:
            client = await self._get_client()
            response = await client.post("/v1/chat/completions", json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            # Track costs
            if "usage" in result:
                self._track_cost(model, result["usage"])
            
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"LiteLLM request failed: {e}")
            
            # Attempt fallback
            if self.fallback_enabled and model != "gpt-4o-mini":
                logger.info("Attempting fallback to gpt-4o-mini")
                payload["model"] = "gpt-4o-mini"
                response = await client.post("/v1/chat/completions", json=payload)
                response.raise_for_status()
                return response.json()
            
            raise
    
    async def generate_video_script(
        self,
        topic: str,
        duration_seconds: int = 60,
        style: str = "professional",
        language: str = "es"
    ) -> Dict[str, Any]:
        """
        Generate video script optimized for HeyGen avatar
        """
        system_prompt = f"""You are a professional video script writer for AI avatar videos.
Write scripts that are:
- Natural and conversational (not robotic)
- Optimized for {duration_seconds} seconds ({duration_seconds * 2.5} words approximately)
- In {language} language
- Style: {style}
- Include natural pauses with [PAUSE] markers
- Start with a hook to grab attention
- End with a clear call to action

Output format:
TITLE: [Video title]
HOOK: [First 10 seconds - attention grabber]
BODY: [Main content]
CTA: [Call to action]
FULL_SCRIPT: [Complete script for TTS]
"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Create a video script about: {topic}"}
        ]
        
        response = await self.chat_completion(
            messages=messages,
            task_type=TaskType.VIDEO_SCRIPT,
            temperature=0.8
        )
        
        return {
            "script": response["choices"][0]["message"]["content"],
            "model_used": response.get("model", "unknown"),
            "usage": response.get("usage", {})
        }
    
    async def translate_content(
        self,
        text: str,
        source_lang: str = "en",
        target_lang: str = "es"
    ) -> str:
        """
        Translate content between languages
        """
        messages = [
            {
                "role": "system",
                "content": f"You are a professional translator. Translate the following text from {source_lang} to {target_lang}. Maintain the tone and style. Only output the translation, nothing else."
            },
            {"role": "user", "content": text}
        ]
        
        response = await self.chat_completion(
            messages=messages,
            task_type=TaskType.TRANSLATION,
            temperature=0.3
        )
        
        return response["choices"][0]["message"]["content"]
    
    def _track_cost(self, model: str, usage: Dict):
        """Track API costs for monitoring"""
        if model not in ModelConfig.MODELS:
            return
        
        config = ModelConfig.MODELS[model]
        input_cost = (usage.get("prompt_tokens", 0) / 1000) * config["cost_per_1k_input"]
        output_cost = (usage.get("completion_tokens", 0) / 1000) * config["cost_per_1k_output"]
        total_cost = input_cost + output_cost
        
        if model not in self.cost_tracking:
            self.cost_tracking[model] = {"total": 0, "requests": 0}
        
        self.cost_tracking[model]["total"] += total_cost
        self.cost_tracking[model]["requests"] += 1
        
        logger.info(f"Cost tracking: {model} = ${total_cost:.4f} (total: ${self.cost_tracking[model]['total']:.4f})")
    
    def get_cost_summary(self) -> Dict[str, Any]:
        """Get cost summary across all models"""
        total = sum(m["total"] for m in self.cost_tracking.values())
        return {
            "total_cost": total,
            "by_model": self.cost_tracking,
            "cost_saved_vs_gpt4": self._calculate_savings()
        }
    
    def _calculate_savings(self) -> float:
        """Calculate savings from using cheaper models"""
        # Estimate what it would cost if all requests went to GPT-4
        gpt4_cost = ModelConfig.MODELS["gpt-4-turbo"]["cost_per_1k_output"]
        
        savings = 0
        for model_name, data in self.cost_tracking.items():
            if model_name in ["glm-4.7", "gpt-4o-mini"]:
                # These are cheaper, calculate what GPT-4 would have cost
                estimated_tokens = data["requests"] * 500  # Rough estimate
                would_have_cost = (estimated_tokens / 1000) * gpt4_cost
                savings += would_have_cost - data["total"]
        
        return savings
    
    async def health_check(self) -> Dict[str, Any]:
        """Check LiteLLM server health"""
        try:
            client = await self._get_client()
            response = await client.get("/health")
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "litellm_url": self.litellm_base_url,
                "models_configured": list(ModelConfig.MODELS.keys())
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "litellm_url": self.litellm_base_url
            }
    
    async def close(self):
        """Close HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None


# Singleton instance
litellm_router = LiteLLMRouterService()


# Convenience functions
async def chat(messages: List[Dict], **kwargs) -> Dict:
    """Quick chat completion"""
    return await litellm_router.chat_completion(messages, **kwargs)


async def generate_script(topic: str, **kwargs) -> Dict:
    """Quick video script generation"""
    return await litellm_router.generate_video_script(topic, **kwargs)


async def translate(text: str, target: str = "es") -> str:
    """Quick translation"""
    return await litellm_router.translate_content(text, target_lang=target)
