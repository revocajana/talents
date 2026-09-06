from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('results', '0007_schoolcompetitionsubmission'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='resultpromotion',
            name='unique_result_promotion_level',
        ),
        migrations.AddConstraint(
            model_name='resultpromotion',
            constraint=models.UniqueConstraint(
                fields=('result_detail', 'to_level'),
                name='unique_detail_promotion_level',
            ),
        ),
    ]
