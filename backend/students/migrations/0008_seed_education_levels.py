from django.db import migrations


TANZANIA_LEVELS = [
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

SAMPLE_COUNTRY_LEVELS = [
    ('Primary 1', 'PRIMARY_1', 'standard', 1),
    ('Primary 2', 'PRIMARY_2', 'standard', 2),
    ('Primary 3', 'PRIMARY_3', 'standard', 3),
    ('Primary 4', 'PRIMARY_4', 'standard', 4),
    ('Primary 5', 'PRIMARY_5', 'standard', 5),
    ('Primary 6', 'PRIMARY_6', 'standard', 6),
    ('Primary 7', 'PRIMARY_7', 'standard', 7),
    ('Secondary I', 'SECONDARY_I', 'form', 1),
    ('Secondary II', 'SECONDARY_II', 'form', 2),
    ('Secondary III', 'SECONDARY_III', 'form', 3),
    ('Secondary IV', 'SECONDARY_IV', 'form', 4),
    ('Secondary V', 'SECONDARY_V', 'form', 5),
    ('Secondary VI', 'SECONDARY_VI', 'form', 6),
]


def seed_levels(apps, schema_editor):
    Country = apps.get_model('core', 'Country')
    EducationLevel = apps.get_model('students', 'EducationLevel')

    definitions = {
        'TZA': TANZANIA_LEVELS,
        'SMP': SAMPLE_COUNTRY_LEVELS,
    }
    for code, levels in definitions.items():
        country = Country.objects.filter(code=code).first()
        if not country:
            continue
        for name, level_code, level_type, order in levels:
            EducationLevel.objects.get_or_create(
                country_id=country.id,
                code=level_code,
                defaults={
                    'name': name,
                    'level_type': level_type,
                    'order': order,
                    'is_active': True,
                },
            )


def unseed_levels(apps, schema_editor):
    EducationLevel = apps.get_model('students', 'EducationLevel')
    codes = [level[1] for level in TANZANIA_LEVELS + SAMPLE_COUNTRY_LEVELS]
    EducationLevel.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('students', '0007_educationlevel_student_education_level_and_more'),
        ('core', '0013_talentcategory_alter_talent_options_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_levels, unseed_levels),
    ]
