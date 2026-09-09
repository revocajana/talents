import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / 'backend'

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from core.models import User


USERNAME = 'talent.admin'
PASSWORD = 'cct2042hz'


def main():
    user, created = User.objects.get_or_create(
        username=USERNAME,
        defaults={
            'role': 'talent_admin',
            'first_name': 'Talent',
            'last_name': 'Admin',
            'is_active': True,
        },
    )

    user.role = 'talent_admin'
    user.is_active = True
    user.set_password(PASSWORD)
    user.save()

    status = 'created' if created else 'updated'
    print(f"Talent admin user '{USERNAME}' {status} with password '{PASSWORD}'")


if __name__ == '__main__':
    main()
