import httpx
import json
from sqlalchemy.orm import Session
import httpx
from typing import List, Dict, Any
from app.core.config import settings
from app.core.security import decrypt_api_key
from .. import models
from ..crud import ai_model as crud_ai_model

async def analyze_story_with_ai(story_content: str, user: models.User, db: Session) -> dict:
    # Default to Ollama if no user settings are found
    provider = 'ollama'
    model_name = settings.OLLAMA_MODEL
    api_key = None

    user_ai_model = crud_ai_model.get_ai_model(db, user_id=user.id)
    if user_ai_model:
        provider = user_ai_model.provider
        model_name = user_ai_model.model_name
        if user_ai_model.api_key:
            api_key = decrypt_api_key(user_ai_model.api_key)

    prompt = f"""Analyze the following story and provide insights on its emotional tone, key themes, and readability. 

    Story:
    {story_content}

    Provide the analysis in a structured JSON format with the following keys: 'emotional_tone', 'key_themes', 'readability', 'sentiment_score'.
    """

    try:
        async with httpx.AsyncClient() as client:
            if provider == 'ollama':
                response = await client.post(
                    f"{settings.OLLAMA_HOST}/api/generate",
                    json={"model": model_name, "prompt": prompt, "stream": False, "format": "json"},
                    timeout=120.0
                )
                response.raise_for_status()
                lines = response.text.strip().split('\n')
                last_line = json.loads(lines[-1])
                analysis_str = last_line.get('response', '{}')
                return json.loads(analysis_str)

            elif provider == 'external':
                if not api_key:
                    return {"error": "API key is required for external provider."}
                
                # Example for OpenAI-compatible API
                # Replace with your actual external API endpoint
                api_url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {api_key}"}
                payload = {
                    "model": model_name,
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                }

                response = await client.post(api_url, json=payload, headers=headers, timeout=60.0)
                response.raise_for_status()
                analysis = response.json()
                return json.loads(analysis['choices'][0]['message']['content'])

            else:
                return {"error": f"Unsupported provider: {provider}"}

    except httpx.RequestError as e:
        return {"error": f"Failed to connect to the AI service: {e}"}
    except json.JSONDecodeError:
        return {"error": "Failed to parse the AI service's response."}
    except Exception as e:
        return {"error": f"Error analyzing story: {str(e)}"}


async def list_available_models() -> List[Dict[str, Any]]:
    """
    Fetch the list of available models from the Ollama API.
    
    Returns:
        List[Dict[str, Any]]: List of available models with their details
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.OLLAMA_HOST}/api/tags",
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract model names and details
            models = []
            for model in data.get("models", []):
                model_info = {
                    "name": model.get("name", ""),
                    "model": model.get("model", ""),
                    "modified_at": model.get("modified_at", ""),
                    "size": model.get("size", 0),
                    "digest": model.get("digest", "")
                }
                models.append(model_info)
            
            return models
            
    except httpx.HTTPStatusError as e:
        return [{"error": f"HTTP error fetching models: {e.response.status_code}"}]
    except httpx.RequestError as e:
        return [{"error": f"Request error fetching models: {str(e)}"}]
    except Exception as e:
        return [{"error": f"Error fetching models: {str(e)}"}]
