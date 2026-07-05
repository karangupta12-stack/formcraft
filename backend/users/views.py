from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .models import User
from .serializers import RegisterSerializer, UserSerializer, ChangePasswordSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    s = RegisterSerializer(data=request.data)
    if s.is_valid():
        user    = s.save()
        refresh = RefreshToken.for_user(user)
        return Response({'user': UserSerializer(user).data, 'access': str(refresh.access_token), 'refresh': str(refresh)}, status=201)
    return Response(s.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username', '').strip().lower()
    password = request.data.get('password', '')
    user     = authenticate(request, username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({'user': UserSerializer(user).data, 'access': str(refresh.access_token), 'refresh': str(refresh)})
    return Response({'error': 'Invalid username or password.'}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    s = ChangePasswordSerializer(data=request.data)
    if s.is_valid():
        user = request.user
        if not user.check_password(s.validated_data['current_password']):
            return Response({'error': 'Current password is incorrect.'}, status=400)
        user.set_password(s.validated_data['new_password'])
        user.save()
        refresh = RefreshToken.for_user(user)
        return Response({'message': 'Password updated.', 'access': str(refresh.access_token), 'refresh': str(refresh)})
    return Response(s.errors, status=400)
