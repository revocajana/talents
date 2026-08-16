#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

print("Checking all users and their roles:")
print("-" * 60)
for user in User.objects.all():
    print(f"ID: {user.id:2} | Username: {user.username:20} | Role: {repr(user.role):20}")
