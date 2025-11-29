"""
URL Helper Utility for Production Compatibility

This module provides dynamic URL generation that works across 
localhost development and production deployments.
"""

import os
from server.common import DEFAULT_PORT


def get_base_url() -> str:
    """
    Get the base URL for the application.
    
    Priority:
    1. API_BASE_URL environment variable (production)
    2. Fallback to localhost with DEFAULT_PORT (development)
    
    Returns:
        str: Base URL without trailing slash
        
    Examples:
        Production: "https://kupuri.com"
        Development: "http://localhost:57988"
    """
    api_base_url = os.environ.get('API_BASE_URL')
    
    if api_base_url:
        # Remove trailing slash if present
        return api_base_url.rstrip('/')
    
    # Development fallback
    return f"http://localhost:{DEFAULT_PORT}"


def get_file_url(filename: str) -> str:
    """
    Generate a full URL for a file served by the API.
    
    Args:
        filename: The filename or file ID to access
        
    Returns:
        str: Complete URL to the file
        
    Example:
        >>> get_file_url("image123.png")
        'https://kupuri.com/api/file/image123.png'
    """
    base_url = get_base_url()
    return f"{base_url}/api/file/{filename}"


def get_image_markdown(image_id: str, filename: str) -> str:
    """
    Generate markdown image syntax with production-compatible URL.
    
    Args:
        image_id: Identifier for the image
        filename: The filename to link to
        
    Returns:
        str: Markdown formatted image link
        
    Example:
        >>> get_image_markdown("img_001", "output.png")
        '![image_id: img_001](https://kupuri.com/api/file/output.png)'
    """
    file_url = get_file_url(filename)
    return f"![image_id: {image_id}]({file_url})"
