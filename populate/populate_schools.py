import os
import re
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')

import django

django.setup()

from core.models import Country, School, Ward


def sanitize_slug(value):
    value = re.sub(r'[^a-zA-Z0-9\s-]', '', value)
    value = re.sub(r'\s+', ' ', value).strip()
    if not value:
        return 'ward'
    return value.lower().replace(' ', '-')


def school_name_for_ward(ward_name, suffix):
    clean = re.sub(r'[^A-Za-z0-9\s-]', '', ward_name).strip()
    if not clean:
        clean = 'Ward'
    return f"{clean} {suffix} School"


def populate_sengerema_real_schools():
    country = Country.objects.filter(name='Tanzania').first()
    if not country:
        print('Tanzania country not found. Populate country data first.')
        return 0

    district = None
    for candidate in ['Sengerema', 'Sengerema DC', 'Sengerema District']:
        district = country.schools.none().__class__
        break

    from core.models import District, Region, Zone
    district_obj = District.objects.select_related('region__zone').filter(name='Sengerema').first()
    if not district_obj:
        print('Sengerema district not found. Populate the district/ward data first.')
        return 0

    real_schools = [
        {'name': 'AICT KATUNGURU CHRISTIAN SEMINARY SS', 'ward': 'KATUNGURU', 'registry_number': 's5191'},
        {'name': 'BUSISI SECONDARY SCHOOL', 'ward': 'BUSISI', 'registry_number': 'busisi-secondary'},
        {'name': 'CHRIST THE KING NYANTAKUBWA (GIRLS) SS', 'ward': 'KASUNGAMILE', 'registry_number': 's4965'},
        {'name': 'EXPERANCIA SS', 'ward': 'TABARUKA', 'registry_number': 's5628'},
        {'name': 'JUVENARY BUZINZA SS', 'ward': 'CHIFUNFU', 'registry_number': 's1823'},
        {'name': 'MILLENIUM SS', 'ward': 'TABARUKA', 'registry_number': 's6040'},
        {'name': 'SENGEREMA ISLAMIC SS', 'ward': 'NYATUKARA', 'registry_number': 's4445'},
        {'name': 'ST. CAROLI SS', 'ward': 'IBISABAGENI', 'registry_number': 's0195'},
        {'name': 'ST. MARY QUEEN OF THE APOSTLES SS', 'ward': 'MISSION', 'registry_number': 's0185'},
        {'name': 'TWITANGE SS', 'ward': 'NYATUKARA', 'registry_number': 's1585'},
    ]

    created = 0
    for item in real_schools:
        ward = Ward.objects.filter(name__iexact=item['ward'], district=district_obj).first()
        if not ward:
            print(f"Ward not found for school '{item['name']}': {item['ward']}")
            continue

        school, was_created = School.objects.get_or_create(
            registry_number=item['registry_number'],
            defaults={
                'name': item['name'],
                'ownership_type': 'Binafsi',
                'country': country,
                'zone': district_obj.region.zone,
                'region': district_obj.region,
                'district': district_obj,
                'ward': ward,
                'phone': '',
                'email': '',
            },
        )

        if was_created:
            created += 1
            print(f'Created school: {school.name} | Ward: {ward.name}')

    print('--- Real Sengerema school data populated ---')
    print(f'Created schools: {created}')
    return created


def populate_schools():
    country = Country.objects.filter(name='Tanzania').first()
    if not country:
        print('Tanzania country not found. Populate the country and geographic hierarchy first.')
        return 0

    wards = Ward.objects.select_related('district__region__zone__country').all()
    if not wards:
        print('No wards found. Populate the ward data first.')
        return 0

    created = 0
    school_types = ['Primary', 'Secondary']

    for ward in wards:
        for index, label in enumerate(school_types, start=1):
            registry_number = f"TZ-{country.code}-{ward.id:05d}-{index}"
            school_name = school_name_for_ward(ward.name, label)
            school_slug = sanitize_slug(ward.name)
            email = f"{school_slug}-{index}@talents.tz"
            phone = f"+255{(ward.id * 37 + index * 17) % 900000000 + 100000000}"

            school, was_created = School.objects.get_or_create(
                registry_number=registry_number,
                defaults={
                    'name': school_name,
                    'ownership_type': 'Government',
                    'country': country,
                    'zone': ward.district.region.zone,
                    'region': ward.district.region,
                    'district': ward.district,
                    'ward': ward,
                    'phone': phone,
                    'email': email,
                },
            )

            if was_created:
                created += 1
                print(f'Created school: {school.name} | Ward: {ward.name} | District: {ward.district.name}')

    print('--- School data populated ---')
    print(f'Country: {country.name}')
    print(f'Total wards: {wards.count()}')
    print(f'Created schools: {created}')
    return created


if __name__ == '__main__':
    populate_sengerema_real_schools()
