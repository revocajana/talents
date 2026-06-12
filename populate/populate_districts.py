import ast
import json
import os
import re
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

from core.models import Country, Zone, Region, District, Ward


def create_country():
    country, _ = Country.objects.get_or_create(
        name='Tanzania',
        defaults={'code': 'TZ'},
    )
    return country


def normalize_name(value):
    return re.sub(r'[\s\-]+', ' ', value.strip().lower())


def load_district_data():
    candidate_paths = [
        os.path.join(PROJECT_ROOT, 'populate', 'districts.js'),
        os.path.join(PROJECT_ROOT, 'populate', 'districts.json'),
    ]

    path = next((p for p in candidate_paths if os.path.exists(p)), None)
    if path is None:
        raise FileNotFoundError(
            'No district data file found. Create one of the following files in the populate/ directory:\n'
            '- districts.js (JavaScript-style object)\n'
            '- districts.json (JSON object)\n'
            'Example format: {"Region Name": {"District Name": ["Ward 1", "Ward 2"]}}'
        )

    with open(path, encoding='utf-8') as input_file:
        content = input_file.read()

    if path.endswith('.json'):
        return json.loads(content)

    content = re.sub(r'<script[^>]*>', '', content)
    content = re.sub(r'</script>', '', content)
    content = re.sub(r'//.*', '', content)
    content = content.strip()

    start = content.find('{')
    end = content.rfind('}')
    if start == -1 or end == -1:
        raise ValueError(f'Unable to locate JSON object in {os.path.basename(path)}')

    content = content[start:end + 1]
    return ast.literal_eval(content)


def get_region(country, region_name):
    normalized_target = normalize_name(region_name)
    for region in Region.objects.select_related('zone').filter(zone__country=country):
        if normalize_name(region.name) == normalized_target:
            return region

    fallback_zones = {
        'dar es salaam': 'Tanganyika Mashariki',
        'mjini magharibi': 'Bluu Visiwani',
        'pemba north': 'Bluu Visiwani',
        'pemba south': 'Bluu Visiwani',
        'unguja north': 'Bluu Visiwani',
        'unguja south': 'Bluu Visiwani',
    }

    if normalized_target in fallback_zones:
        zone_name = fallback_zones[normalized_target]
        zone = Zone.objects.filter(name=zone_name, country=country).first()
        if zone:
            region, created = Region.objects.get_or_create(name=region_name, zone=zone)
            if created:
                print(f"Created missing region '{region_name}' under zone '{zone_name}'")
            return region

    return None


def populate_districts():
    country = create_country()
    district_data = load_district_data()

    created_counts = {'regions': 0, 'districts': 0, 'wards': 0}
    skipped_regions = []

    for region_name, districts in district_data.items():
        region = get_region(country, region_name)
        if not region:
            skipped_regions.append(region_name)
            continue

        for district_name, ward_names in districts.items():
            district, district_created = District.objects.get_or_create(
                name=district_name,
                region=region,
            )
            if district_created:
                created_counts['districts'] += 1
                print(f"Created district: {district_name} ({region_name})")

            for ward_name in ward_names:
                _, ward_created = Ward.objects.get_or_create(
                    name=ward_name,
                    district=district,
                )
                if ward_created:
                    created_counts['wards'] += 1

    print('--- District and ward data populated ---')
    print(f"Regions processed: {len(district_data) - len(skipped_regions)}")
    print(f"Districts created: {created_counts['districts']}")
    print(f"Wards created: {created_counts['wards']}")
    print(f"Skipped regions: {len(skipped_regions)}")
    if skipped_regions:
        print('Missing regions:')
        for region_name in skipped_regions:
            print(f'  - {region_name}')


if __name__ == '__main__':
    populate_districts()
