#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import TalentCategory, Talent
from django.db import connection

# Map of category values to display names
category_map = {
    'music': 'Music',
    'sports': 'Sports',
    'technology': 'Technology',
    'arts': 'Arts',
    'academics': 'Academics',
    'other': 'Other',
}

print("=== Creating TalentCategory records ===\n")

# Create TalentCategory records
categories = {}
for category_value, display_name in category_map.items():
    category_obj, created = TalentCategory.objects.get_or_create(
        name=display_name,
        defaults={'description': f'Category for {display_name}'}
    )
    categories[category_value] = category_obj
    print(f"✓ {'Created' if created else 'Found'}: {display_name} (id={category_obj.id})")

print("\n=== Updating Talent records in database ===\n")

# Update the database directly since category_id contains string values
with connection.cursor() as cursor:
    updated_total = 0
    for category_value, category_obj in categories.items():
        cursor.execute(
            f"UPDATE core_talent SET category_id = %s WHERE category_id = %s",
            [category_obj.id, category_value]
        )
        rows_affected = cursor.rowcount
        if rows_affected > 0:
            print(f"✓ Updated {rows_affected} talents: '{category_value}' -> {category_obj.name} (id={category_obj.id})")
            updated_total += rows_affected

print(f"\n✓ Migration complete! Updated {updated_total} talents.")
print(f"✓ Total categories created: {len(categories)}")
