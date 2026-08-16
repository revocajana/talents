#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User
from core.serializers import UserSerializer

# Get the wilson user
user = User.objects.get(username='wilson')

print("Raw user object:")
print(f"  id: {user.id}")
print(f"  username: {user.username}")
print(f"  role: {repr(user.role)}")
print(f"  has role attr: {hasattr(user, 'role')}")
print()

# Serialize it
serializer = UserSerializer(user)
data = serializer.data

print("Serialized data:")
print(json.dumps(data, indent=2, default=str))
