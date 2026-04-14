from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer
from utils.firebase import verify_firebase_token # Import the verifier [cite: 580, 581]

@api_view(['POST'])
def login(request):
    # React sends the token here [cite: 661]
    token = request.data.get('token')

    if not token:
        return Response({"error": "No token provided"}, status=400)

    # Verify token with Firebase
    decoded_token = verify_firebase_token(token)

    if not decoded_token:
        return Response({"error": "Invalid or expired token"}, status=401)

    # Extract the email verified by Firebase
    email = decoded_token.get('email')

    try:
        # Find the user by email (No password check needed!)
        user = User.objects.get(email=email)
        return Response({
            "message": "Login successful", 
            "user_id": user.id,
            "role": user.role
        })
    except User.DoesNotExist:
        return Response({"error": "User not found in database"}, status=404)
    
@api_view(['POST'])
def signup(request):
    token = request.data.get('token')
    name = request.data.get('name')
    role = request.data.get('role')

    # Basic validation
    if not token or not name or not role:
        return Response({"error": "Missing token, name, or role"}, status=400)

    if role not in ['NGO', 'VOLUNTEER']:
        return Response({"error": "Invalid role. Must be NGO or VOLUNTEER"}, status=400)

    # 1. Verify the token with Firebase
    decoded_token = verify_firebase_token(token)
    if not decoded_token:
        return Response({"error": "Invalid or expired token"}, status=401)

    # 2. Extract the email from the verified token
    # We trust this email because Firebase verified it!
    email = decoded_token.get('email')

    # 3. Check if user already exists in PostgreSQL
    if User.objects.filter(email=email).exists():
        return Response({"error": "User with this email already exists"}, status=400)

    # 4. Create the new user in Django
    try:
        new_user = User.objects.create(
            name=name,
            email=email,
            role=role
        )
        
        # Matching your architecture's expected output format
        return Response({
            "message": "User created successfully",
            "user_id": new_user.id
        }, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)