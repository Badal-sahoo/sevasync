import requests
import os
import json

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def refine_severities_bulk(cluster_batch):
    """
    Expects a dictionary like:
    {
        "cluster_1": {"total_needs": 10, "medical": 2, "density": "high", "base_severity": "HIGH"},
        "cluster_2": {...}
    }
    Returns a dictionary mapping IDs to refined severities:
    {
        "cluster_1": "HIGH",
        "cluster_2": "LOW"
    }
    """
    if not cluster_batch:
        return {}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

    prompt = f"""
You are an NGO assistant evaluating deployment severities.
Analyze the following batch of clusters. Return ONLY a valid JSON object mapping the cluster ID to its refined severity (LOW, MEDIUM, or HIGH). Do not include markdown formatting.

Cluster Data:
{json.dumps(cluster_batch, indent=2)}

Expected Output Format:
{{
    "cluster_1": "HIGH",
    "cluster_2": "MEDIUM"
}}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json" # 🔹 Forces Gemini to return strict JSON
        }
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status() # Raises an error for bad HTTP codes
        data = response.json()

        # Parse the JSON response
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        return json.loads(raw_text)

    except Exception as e:
        print("🔥 GEMINI API BATCH ERROR:", e)
        # 🔹 Failsafe: If the API goes down, fall back to the base severities so the pipeline doesn't crash
        return {str(cid): cdata["base_severity"] for cid, cdata in cluster_batch.items()}