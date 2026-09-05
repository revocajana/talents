from django.db import migrations


LEVELS = [
    ('Standard 1', 'STD_1', 'standard', 1),
    ('Standard 2', 'STD_2', 'standard', 2),
    ('Standard 3', 'STD_3', 'standard', 3),
    ('Standard 4', 'STD_4', 'standard', 4),
    ('Standard 5', 'STD_5', 'standard', 5),
    ('Standard 6', 'STD_6', 'standard', 6),
    ('Standard 7', 'STD_7', 'standard', 7),
    ('Form I', 'FORM_I', 'form', 1),
    ('Form II', 'FORM_II', 'form', 2),
    ('Form III', 'FORM_III', 'form', 3),
    ('Form IV', 'FORM_IV', 'form', 4),
    ('Form V', 'FORM_V', 'form', 5),
    ('Form VI', 'FORM_VI', 'form', 6),
]


def seed_tanzania_levels(apps, schema_editor):
    Country = apps.get_model('core', 'Country')
    EducationLevel = apps.get_model('students', 'EducationLevel')
    country = Country.objects.filter(name__iexact='Tanzania').first()
    if not country:
        return
    for name, code, level_type, order in LEVELS:
        EducationLevel.objects.get_or_create(
            country_id=country.id,
            code=code,
            defaults={
                'name': name,
                'level_type': level_type,
                'order': order,
                'is_active': True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ('students', '0008_seed_education_levels'),
    ]

    operations = [
        migrations.RunPython(seed_tanzania_levels, migrations.RunPython.noop),
    ]
