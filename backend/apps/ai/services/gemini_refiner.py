import requests
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def refine_severity(features, base_severity):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

    prompt = f"""
You are an NGO assistant.

Cluster Data:
- Total Needs: {features['total_needs']}
- Medical: {features['medical']}
- Food: {features['food']}
- Water: {features['water']}
- Shelter: {features['shelter']}
- Electricity: {features['electricity']}
- General: {features['general']}
- Density: {features['density']}
- Base Severity: {base_severity}

Output ONLY one word: LOW, MEDIUM, or HIGH.
"""

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    response = requests.post(url, json=payload)
    data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except:
        return base_severity  # fallback safety