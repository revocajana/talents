import os
import sys

# Add the project root (the directory containing manage.py) to PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
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

from core.models import (
    Country,
    Zone,
    Region,
    District,
    Ward,
    School,
    User,
    Parent,
)
from django.contrib.auth.hashers import make_password


def create_country():
    country, _ = Country.objects.get_or_create(
        name="Tanzania",
        defaults={"code": "TZ"},
    )
    return country


GEOGRAPHY_DATA = [
    {
        "zone": "Lake Zone",
        "regions": [
            {
                "region": "Mwanza",
                "districts": [
                    {
                        "district": "Nyamagana",
                        "wards": [
                            "Nyamagana",
                            "Mbugani",
                            "Mirongo",
                            "Mkuyuni",
                        ],
                    },
                    {
                        "district": "Ilemela",
                        "wards": [
                            "Nyakato",
                            "Kirumba",
                            "Bugogwa",
                            "Kawekamo",
                        ],
                    },
                    {
                        "district": "Sengerema",
                        "wards": [
                            "Busisi",
                            "Nyampulukano",
                            "Kasungamile",
                            "Sengerema",
                        ],
                    },
                    {
                        "district": "Misungwi",
                        "wards": [
                            "Misungwi",
                            "Usagara",
                            "Mbarika",
                        ],
                    },
                    {
                        "district": "Magu",
                        "wards": [
                            "Magu",
                            "Kisesa",
                            "Bujora",
                        ],
                    },
                ],
            },
        ],
    },
]


def populate_geography(country):
    for zone_entry in GEOGRAPHY_DATA:
        zone_obj, _ = Zone.objects.get_or_create(
            name=zone_entry["zone"],
            country=country,
        )

        for region_entry in zone_entry.get("regions", []):
            region_obj, _ = Region.objects.get_or_create(
                name=region_entry["region"],
                zone=zone_obj,
            )

            for district_entry in region_entry.get("districts", []):
                district_obj, _ = District.objects.get_or_create(
                    name=district_entry["district"],
                    region=region_obj,
                )

                for ward_name in district_entry.get("wards", []):
                    Ward.objects.get_or_create(
                        name=ward_name,
                        district=district_obj,
                    )


def create_schools():
    schools_data = [
        {
            "registry_number": "2047",
            "name": "Busisi Secondary School",
            "ownership_type": "Government",
            "ward": "Busisi",
        },
        {
            "registry_number": "2438",
            "name": "Nyakato Secondary School",
            "ownership_type": "Government",
            "ward": "Nyakato",
        },
        {
            "registry_number": "4499",
            "name": "Kirumba Secondary School",
            "ownership_type": "Government",
            "ward": "Kirumba",
        },
        {
            "registry_number": "1348",
            "name": "Sengerema Secondary School",
            "ownership_type": "Government",
            "ward": "Sengerema",
        },
        {
            "registry_number": "1586",
            "name": "Magu Secondary School",
            "ownership_type": "Government",
            "ward": "Magu",
        },
    ]

    created_schools = []

    for item in schools_data:
        ward = Ward.objects.get(name=item["ward"])
        district = ward.district
        region = district.region
        zone = region.zone
        country = zone.country

        school, _ = School.objects.get_or_create(
            registry_number=item["registry_number"],
            defaults={
                "name": item["name"],
                "ownership_type": item["ownership_type"],
                "country": country,
                "zone": zone,
                "region": region,
                "district": district,
                "ward": ward,
            },
        )

        created_schools.append(school)

    return created_schools


def create_user(school):
    user, created = User.objects.get_or_create(
        username="admin",
        defaults={
            "email": "admin@talents.com",
            "first_name": "System",
            "last_name": "Administrator",
            "role": "super_admin",
            "school": school,
        },
    )

    if created:
        user.set_password("admin123")
        user.save()

    return user


def create_parent():
    parent, _ = Parent.objects.get_or_create(
        username="parent1",
        defaults={
            "full_name": "John Doe",
            "phone": "+255123456789",
            "email": "johndoe@example.com",
            "password": make_password("parent123"),
        },
    )
    return parent


def populate():
    country = create_country()

    populate_geography(country)

    schools = create_schools()

    user = create_user(schools[0])

    parent = create_parent()

    print("--- Core data populated ---")
    print(f"Zones:     {Zone.objects.filter(country=country).count()}")
    print(f"Regions:   {Region.objects.filter(zone__country=country).count()}")
    print(f"Districts: {District.objects.filter(region__zone__country=country).count()}")
    print(f"Wards:     {Ward.objects.filter(district__region__zone__country=country).count()}")
    print(f"Schools:   {School.objects.count()}")

    for school in schools:
        print(f"  - {school.name}")

    print(f"User:   {user.username} (role={user.role})")
    print(f"Parent: {parent.username}")


if __name__ == "__main__":
    populate()
