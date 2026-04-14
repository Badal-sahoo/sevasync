import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()
# Client initialize
client = genai.Client(api_key=os.getenv("AI_API_KEY"))

def extract_needs_from_text(raw_text):
    """
    Passes raw text to the AI and requests a structured JSON response.
    """
    prompt = f"""
    Analyze the following community report and extract the urgent needs.
    Categorize the needs into types: food, medical, water, shelter, or general.
    Determine the urgency as: low, medium, or high.
    Extract the location if mentioned, otherwise leave it blank.

    Return ONLY a valid JSON array of objects with keys: "type", "urgency", "location".

    Report: "{raw_text}"
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        text = response.text.strip()

        if text.startswith("```"):
            text = text.replace("```json", "").replace("```", "").strip()

        needs_list = json.loads(text)
        return needs_list

    except Exception as e:
        print(f"AI API Error: {e}")
        return []