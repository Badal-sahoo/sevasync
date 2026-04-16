# utils/auth.py

from utils.firebase import verify_firebase_token
from apps.users.models import User

def get_current_user(request):
    token = request.headers.get("Authorization")

    if not token:
        return None

    # If "Bearer xxx"
    if token.startswith("Bearer "):
        token = token.split(" ")[1]

    decoded = verify_firebase_token(token)

    if not decoded:
        return None

    email = decoded.get("email")

    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None