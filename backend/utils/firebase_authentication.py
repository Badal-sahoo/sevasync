from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser

from apps.users.models import User
from utils.firebase import verify_firebase_token


class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        #print("HEADER:", auth_header)

        if not auth_header:
            return None

        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            raise AuthenticationFailed("Invalid token format")

        decoded_token = verify_firebase_token(token)
        #print("DECODED:", decoded_token)

        if not decoded_token:
            raise AuthenticationFailed("Invalid Firebase token")

        email = decoded_token.get("email")
        #print("EMAIL:", email)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found")

        return (user, None)