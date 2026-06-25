from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User
from utils.firebase import verify_firebase_token
from apps.volunteers.models import Volunteer


@api_view(['POST'])
def login(request):
    token = request.data.get('token')

    if not token:
        return Response({"error": "No token provided"}, status=400)

    decoded_token = verify_firebase_token(token)
    if not decoded_token:
        return Response({"error": "Invalid or expired token"}, status=401)

    email = decoded_token.get('email')

    try:
        user = User.objects.get(email=email)
        return Response({"message": "Login successful", "user_id": user.id, "role": user.role})
    except User.DoesNotExist:
        return Response({"error": "User not found in database"}, status=404)


@api_view(['POST'])
def signup(request):
    token = request.data.get('token')
    name = request.data.get('name')
    role = request.data.get('role')

    if not token or not name or not role:
        return Response({"error": "Missing token, name, or role"}, status=400)

    if role not in User.Role.values:
        return Response({"error": "Invalid role. Must be NGO or VOLUNTEER"}, status=400)

    decoded_token = verify_firebase_token(token)
    if not decoded_token:
        return Response({"error": "Invalid or expired token"}, status=401)

    email = decoded_token.get('email')

    if User.objects.filter(email=email).exists():
        return Response({"error": "User with this email already exists"}, status=400)

    try:
        new_user = User.objects.create(name=name, email=email, role=role)

        if role == User.Role.VOLUNTEER:
            Volunteer.objects.create(user=new_user, skills=[], location="Not set", availability=True)

        return Response({"message": "User created successfully", "user_id": new_user.id}, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
