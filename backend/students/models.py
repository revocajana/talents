from django.db import models

from core.models import School, Parent


def _generate_student_id():
    """Generate a unique student identifier."""
    import uuid
    return f"SID-{uuid.uuid4().hex[:10].upper()}"


class EducationLevel(models.Model):
    LEVEL_TYPE_CHOICES = [
        ('standard', 'Standard'),
        ('form', 'Form'),
    ]

    country = models.ForeignKey('core.Country', on_delete=models.CASCADE, related_name='education_levels')
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=20)
    level_type = models.CharField(max_length=20, choices=LEVEL_TYPE_CHOICES)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['level_type', 'order', 'name']
        constraints = [
            models.UniqueConstraint(fields=['country', 'code'], name='unique_education_level_per_country'),
        ]

    def __str__(self):
        return f'{self.name} ({self.country.name})'



class Student(models.Model):
    """Represents a student enrolled in a school.

    Fields include basic personal information, a link to the school they attend,
    and an optional link to a parent/guardian account.
    """

    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    education_level = models.ForeignKey(EducationLevel, on_delete=models.PROTECT, null=True, blank=True, related_name='students')
    # link to the school; cascade delete if school removed
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="students")
    # optional parent/guardian relationship
    parent = models.ForeignKey(Parent, on_delete=models.SET_NULL, null=True, blank=True, related_name="children")
    # optional unique identifier for the student
    student_id = models.CharField(max_length=50, unique=True, null=True, blank=True, default=_generate_student_id, editable=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id or 'No ID'})"

    class Meta:
        ordering = ["last_name", "first_name"]
