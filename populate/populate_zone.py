import os
import sys

# Add the project root (the directory containing manage.py) to PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

# Add the backend package directory so that "core" can be imported as a top-level module
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

# Now configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')

import django
django.setup()

from core.models import Country, Zone, Region


def create_country():
    country, _ = Country.objects.get_or_create(
        name='Tanzania',
        defaults={'code': 'TZ'},
    )
    return country


ZONE_REGION_DATA = [
    {
        'zone': 'Kahawa & Dhahabu',
        'regions': ['Kagera', 'Kigoma', 'Geita', 'Karagwe'],
    },
    {
        'zone': 'Ziwa Victoria',
        'regions': ['Mwanza', 'Mara', 'Simiyu'],
    },
    {
        'zone': 'Almasi & Alizeti',
        'regions': ['Shinyanga', 'Tabora'],
    },
    {
        'zone': 'Zabibu & Alizeti',
        'regions': ['Dodoma', 'Singida'],
    },
    {
        'zone': 'Mlimani Kasikazini',
        'regions': ['Manyara', 'Arusha', 'Kilimanjaro', 'Tanga'],
    },
    {
        'zone': 'Tanganyika Mashariki',
        'regions': ['Dar es Salaam', 'Pwani', 'Morogoro'],
    },
    {
        'zone': 'Nyasa & Mchuchuma',
        'regions': ['Njombe', 'Iringa', 'Mbeya'],
    },
    {
        'zone': 'Korosho Kusini',
        'regions': ['Lindi', 'Mtwara', 'Ruvuma'],
    },
    {
        'zone': 'Tanganyika Kusini',
        'regions': ['Songwe', 'Rukwa', 'Katavi'],
    },
    {
        'zone': 'Bluu Visiwani',
        'regions': ['Mjini Magharibi', 'Pemba North', 'Pemba South', 'Unguja North', 'Unguja South'],
    },
]


def populate_zones(country):
    for entry in ZONE_REGION_DATA:
        zone_obj, created = Zone.objects.get_or_create(
            name=entry['zone'],
            country=country,
        )
        if created:
            print(f"Created zone: {zone_obj.name}")
        for region_name in entry['regions']:
            region_obj, region_created = Region.objects.get_or_create(
                name=region_name,
                zone=zone_obj,
            )
            if region_created:
                print(f"  Created region: {region_obj.name}")


def populate():
    country = create_country()
    populate_zones(country)

    print('--- Zone and region data populated ---')
    print(f"Country: {country.name}")
    print(f"Zones:   {Zone.objects.filter(country=country).count()}")
    print(f"Regions: {Region.objects.filter(zone__country=country).count()}")


if __name__ == '__main__':
    populate()
