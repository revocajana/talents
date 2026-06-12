import os
import sys

# Add project and backend to path (same approach as populate scripts)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')

import django
django.setup()

from core.models import Country, Zone, Region, District, Ward

country = Country.objects.filter(name='Tanzania').first()
if not country:
    print('Country Tanzania not found')
else:
    print('Country:', country.name)
    print('Zones:', Zone.objects.filter(country=country).count())
    print('Regions:', Region.objects.filter(zone__country=country).count())
    print('Districts:', District.objects.filter(region__zone__country=country).count())
    print('Wards:', Ward.objects.filter(district__region__zone__country=country).count())
