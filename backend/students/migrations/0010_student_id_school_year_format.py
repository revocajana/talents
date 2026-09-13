from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('students', '0009_seed_tanzania_education_levels'),
    ]

    operations = [
        migrations.AlterField(
            model_name='student',
            name='student_id',
            field=models.CharField(blank=True, default=None, editable=False, max_length=50, null=True, unique=True),
        ),
    ]
