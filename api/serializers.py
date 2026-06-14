from rest_framework import serializers

from backend.core.models import User


class UserSerializer(serializers.ModelSerializer):
    """Serialize authenticated user data for frontend consumption."""

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'school']
