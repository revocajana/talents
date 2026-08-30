import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
for path in (BACKEND_DIR, PROJECT_ROOT):
    if path not in sys.path:
        sys.path.insert(0, path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from core.models import SchoolOwnershipType

DEFAULT_SCHOOL_OWNERSHIP_TYPES = [
    'Government',
    'Private',
    'Organization',
    'Lutheran',
    'Roman Catholic',
    'SDA',
    'Company',
    'Sunni',
    'Pentecoste',
    'Shia',
    'Aglican',
    'Moravian',
    'Hindu',
    'Ahmadiyya',
    'Other',
]


def seed_school_ownership_types():
    created = 0
    for name in DEFAULT_SCHOOL_OWNERSHIP_TYPES:
        obj, was_created = SchoolOwnershipType.objects.get_or_create(name=name)
        if was_created:
            created += 1
    return created


if __name__ == '__main__':
    created = seed_school_ownership_types()
    print(f'Seeded {created} school ownership types.')
