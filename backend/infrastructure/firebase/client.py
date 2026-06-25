import os
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

load_dotenv()


def _build_credentials():
    """Load Firebase Admin credentials.

    Two supported sources (in order):
      1. FIREBASE_CREDENTIALS — path to a service-account JSON file (local dev).
      2. Individual env vars (FIREBASE_PROJECT_ID / FIREBASE_PRIVATE_KEY /
         FIREBASE_CLIENT_EMAIL) — preferred for hosts like Render where you set
         secrets as env vars instead of committing a JSON file.
    """
    cred_path = os.getenv("FIREBASE_CREDENTIALS")
    if cred_path and os.path.exists(cred_path):
        return credentials.Certificate(cred_path)

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")

    if project_id and private_key and client_email:
        return credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            # Env vars store the key with literal "\n"; turn them into real newlines.
            "private_key": private_key.replace("\\n", "\n"),
            "client_email": client_email,
            "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        })

    raise RuntimeError(
        "Firebase credentials not configured. Set FIREBASE_CREDENTIALS (JSON path) "
        "or FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL."
    )


if not firebase_admin._apps:
    firebase_admin.initialize_app(_build_credentials())


def verify_firebase_token(token):
    try:
        return auth.verify_id_token(token)
    except Exception as e:
        print(f"FIREBASE VERIFY ERROR: {e}")
        return None
