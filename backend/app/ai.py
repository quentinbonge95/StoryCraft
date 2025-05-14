import httpx

OLLAMA_URL = "http://ollama:11434/api/generate"

def analyze_story(content: str):
    prompt = f"Analyze this story:\n\n{content}\n\nIdentify emotional impact, 5-second moment, and improvement suggestions."
    payload = {
        "model": "llama3",  # Adjust model if different
        "prompt": prompt,
        "stream": False
    }
    try:
        response = httpx.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        return response.json().get("response", "")
    except Exception as e:
        return f"AI Analysis failed: {str(e)}"
