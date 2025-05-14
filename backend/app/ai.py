import os, httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate")

def analyze_story(content: str) -> str:
    prompt = (
        "Analyze this story:\n\n"
        f"{content}\n\n"
        "Identify emotional impact, 5-second moment, and improvement suggestions."
    )
    payload = {"model": "llama3", "prompt": prompt, "stream": False}
    try:
        r = httpx.post(OLLAMA_URL, json=payload, timeout=60)
        r.raise_for_status()
        # Ollama returns { "response": "..." }
        return r.json().get("response", "")
    except Exception as e:
        return f"AI Analysis failed: {e}"
