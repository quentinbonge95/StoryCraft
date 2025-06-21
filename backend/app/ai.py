import re
import httpx
from .core.config import settings

# Use OLLAMA_HOST from settings and append /api/generate
OLLAMA_URL = f"{settings.OLLAMA_HOST}/api/generate"

def remove_think_tags(text: str) -> str:
    """Remove content within <think> tags from the response."""
    return re.sub(r'<think>.*?<\/think>', '', text, flags=re.DOTALL).strip()

def analyze_story(content: str, model_name: str = None) -> str:
    prompt = (
        "Using Storyworthy principles by Matt Dicks, analyze this story focusing on:\n"
        "1. The '5-second moment' - identify the most emotionally charged moment\n"
        "2. Story structure - evaluate beginning/middle/end balance\n"
        "3. Transformation - how the protagonist changes\n"
        "4. Specificity - highlight where more vivid details could enhance the story\n"
        "5. Emotional arc - map the emotional journey\n\n"
        "Provide concise analysis in this format:\n"
        "1. Core Moment: [identify the 5-second moment]\n"
        "2. Structure: [evaluation]\n"
        "3. Transformation: [description]\n"
        "4. Specificity Suggestions: [2-3 specific areas]\n"
        "5. Emotional Arc: [description]\n\n"
        "Do not repeat the story content in your response."
    )
    # Use provided model_name or fall back to settings
    model_to_use = model_name or settings.OLLAMA_MODEL
    
    payload = {
        "model": model_to_use,
        "prompt": prompt, 
        "stream": False,
        "options": {
            "seed": 42,
            "temperature": 0.7
        }
    }
    try:
        r = httpx.post(OLLAMA_URL, json=payload, timeout=400)
        r.raise_for_status()
        response = r.json().get("response", "").strip()
        # Remove any <think> tags from the response
        return remove_think_tags(response)
    except Exception as e:
        return f"Analysis Error: {str(e)}"