import os
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase app only once
if not firebase_admin._apps:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
    })
    firebase_admin.initialize_app(cred)

def verify_firebase_token(token):
    try:
        # This checks if the token is valid, not expired, and issued by your project
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"🔥 FIREBASE VERIFY ERROR: {e}")
        return None