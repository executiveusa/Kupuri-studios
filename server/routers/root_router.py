import os
from fastapi import APIRouter
import requests
import httpx
from models.tool_model import ToolInfoJson
from services.tool_service import tool_service
from services.config_service import config_service
from services.db_service import db_service
from utils.http_client import HttpClient
# services
from models.config_model import ModelInfo
from typing import List
from services.tool_service import TOOL_MAPPING

router = APIRouter(prefix="/api")


def get_ollama_model_list() -> List[str]:
    base_url = config_service.get_config().get('ollama', {}).get(
        'url', os.getenv('OLLAMA_HOST', 'http://localhost:11434'))
    try:
        response = requests.get(f'{base_url}/api/tags', timeout=5)
        response.raise_for_status()
        data = response.json()
        return [model['name'] for model in data.get('models', [])]
    except requests.RequestException as e:
        print(f"Error querying Ollama: {e}")
        return []


async def get_comfyui_model_list(base_url: str) -> List[str]:
    """Get ComfyUI model list from object_info API"""
    try:
        timeout = httpx.Timeout(10.0)
        async with HttpClient.create(timeout=timeout) as client:
            response = await client.get(f"{base_url}/api/object_info")
            if response.status_code == 200:
                data = response.json()
                # Extract models from CheckpointLoaderSimple node
                models = data.get('CheckpointLoaderSimple', {}).get(
                    'input', {}).get('required', {}).get('ckpt_name', [[]])[0]
                return models if isinstance(models, list) else []  # type: ignore
            else:
                print(f"ComfyUI server returned status {response.status_code}")
                return []
    except Exception as e:
        print(f"Error querying ComfyUI: {e}")
        return []

# List all LLM models
@router.get("/list_models")
async def get_models() -> list[ModelInfo]:
    config = config_service.get_config()
    res: List[ModelInfo] = []
    
    # ENV VAR OVERRIDES - Check for API keys in environment
    google_api_key = os.getenv('GOOGLE_API_KEY', '').strip()
    openai_api_key = os.getenv('OPENAI_API_KEY', '').strip()
    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY', '').strip()
    
    # ALWAYS add Google Gemini models if GOOGLE_API_KEY is set in environment
    # These are free-tier models that work with just a Google API key
    if google_api_key and google_api_key != 'AIzaSyDummyKeyForTesting123456789':
        res.extend([
            {'provider': 'google', 'model': 'gemini-2.0-flash-exp', 'url': 'https://generativelanguage.googleapis.com/v1beta/', 'type': 'text'},
            {'provider': 'google', 'model': 'gemini-1.5-flash', 'url': 'https://generativelanguage.googleapis.com/v1beta/', 'type': 'text'},
            {'provider': 'google', 'model': 'gemini-1.5-pro', 'url': 'https://generativelanguage.googleapis.com/v1beta/', 'type': 'text'},
        ])
    
    # Add Jaaz-hosted models (free tier, no API key needed from user)
    jaaz_url = os.getenv('BASE_API_URL', 'https://jaaz.app').rstrip('/') + '/api/v1/'
    res.extend([
        {'provider': 'jaaz', 'model': 'gpt-4o-mini', 'url': jaaz_url, 'type': 'text'},
        {'provider': 'jaaz', 'model': 'deepseek/deepseek-chat-v3-0324', 'url': jaaz_url, 'type': 'text'},
    ])

    # Handle Ollama models separately
    ollama_url = config.get('ollama', {}).get(
        'url', os.getenv('OLLAMA_HOST', 'http://localhost:11434'))
    # Add Ollama models if URL is available
    if ollama_url and ollama_url.strip():
        ollama_models = get_ollama_model_list()
        for ollama_model in ollama_models:
            res.append({
                'provider': 'ollama',
                'model': ollama_model,
                'url': ollama_url,
                'type': 'text'
            })

    for provider in config.keys():
        if provider in ['ollama', 'google']:  # Skip google since we handled it above
            continue

        provider_config = config[provider]
        provider_url = provider_config.get('url', '').strip()
        provider_api_key = provider_config.get('api_key', '').strip()

        # Skip provider if URL is empty or API key is empty
        if not provider_url or not provider_api_key:
            continue

        models = provider_config.get('models', {})
        for model_name in models:
            model = models[model_name]
            model_type = model.get('type', 'text')
            # Only return text models
            if model_type == 'text':
                # Avoid duplicates with Jaaz models we already added
                existing = [m for m in res if m['provider'] == provider and m['model'] == model_name]
                if not existing:
                    res.append({
                        'provider': provider,
                        'model': model_name,
                        'url': provider_url,
                        'type': model_type
                    })
    return res


@router.get("/list_tools")
async def list_tools() -> list[ToolInfoJson]:
    config = config_service.get_config()
    res: list[ToolInfoJson] = []
    
    # ALWAYS include Jaaz-hosted tools (they use Jaaz's backend API key, not user's)
    # These are the core image generation tools that make the app usable
    jaaz_tools = [
        {'id': 'generate_image_by_gpt_image_1_jaaz', 'provider': 'jaaz', 'type': 'image', 'display_name': 'GPT Image 1'},
        {'id': 'generate_image_by_imagen_4_jaaz', 'provider': 'jaaz', 'type': 'image', 'display_name': 'Imagen 4'},
        {'id': 'generate_image_by_recraft_v3_jaaz', 'provider': 'jaaz', 'type': 'image', 'display_name': 'Recraft v3'},
        {'id': 'generate_image_by_flux_kontext_pro_jaaz', 'provider': 'jaaz', 'type': 'image', 'display_name': 'Flux Kontext Pro'},
        {'id': 'generate_video_by_kling_v2_jaaz', 'provider': 'jaaz', 'type': 'video', 'display_name': 'Kling v2.1'},
    ]
    res.extend(jaaz_tools)
    
    for tool_id, tool_info in tool_service.tools.items():
        if tool_info.get('provider') == 'system':
            continue
        provider = tool_info['provider']
        # Skip jaaz tools since we added them above
        if provider == 'jaaz':
            continue
        provider_config = config.get(provider, {})
        provider_api_key = provider_config.get('api_key', '').strip()
        if provider != 'comfyui' and not provider_api_key:
            continue
        res.append({
            'id': tool_id,
            'provider': tool_info.get('provider', ''),
            'type': tool_info.get('type', ''),
            'display_name': tool_info.get('display_name', ''),
        })

    # Handle ComfyUI models separately
    # comfyui_config = config.get('comfyui', {})
    # comfyui_url = comfyui_config.get('url', '').strip()
    # comfyui_config_models = comfyui_config.get('models', {})
    # if comfyui_url:
    #     comfyui_models = await get_comfyui_model_list(comfyui_url)
    #     for comfyui_model in comfyui_models:
    #         if comfyui_model in comfyui_config_models:
    #             res.append({
    #                 'provider': 'comfyui',
    #                 'model': comfyui_model,
    #                 'url': comfyui_url,
    #                 'type': 'image'
    #             })

    return res


@router.get("/list_chat_sessions")
async def list_chat_sessions():
    return await db_service.list_sessions()


@router.get("/chat_session/{session_id}")
async def get_chat_session(session_id: str):
    return await db_service.get_chat_history(session_id)
