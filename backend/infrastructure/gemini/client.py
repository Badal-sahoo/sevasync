import os
import json
import requests

_API_KEY = os.getenv("GEMINI_API_KEY")
_BASE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.0-flash:generateContent"
)


def is_available():
    return bool(_API_KEY)


def generate(prompt, response_mime_type="application/json"):
    if not _API_KEY:
        return None

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": response_mime_type},
    }

    try:
        response = requests.post(
            f"{_BASE_URL}?key={_API_KEY}", json=payload, timeout=10
        )
        response.raise_for_status()
        raw = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        if response_mime_type == "application/json":
            return json.loads(raw)
        return raw
    except Exception as e:
        print(f"GEMINI CLIENT ERROR: {e}")
        return None
