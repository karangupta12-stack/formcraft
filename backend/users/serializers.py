from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=4)
    confirm_password = serializers.CharField(write_only=True)
    display_name     = serializers.CharField(required=True)

    class Meta:
        model  = User
        fields = ['username', 'display_name', 'password', 'confirm_password']

    def validate_username(self, value):
        v = value.strip().lower()
        if User.objects.filter(username=v).exists():
            raise serializers.ValidationError('This username is already taken.')
        return v

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        display_name = validated_data.pop('display_name', '')
        user = User.objects.create_user(**validated_data)
        user.display_name = display_name
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'display_name', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password     = serializers.CharField(min_length=4)
    confirm_password = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs
