import re

from django.db import models
from django.utils import timezone

from core.models import School, Parent


def _generate_student_id():
    """Compatibility helper retained for historical migrations."""
    return None


def generate_student_id(school):
    """Generate the next school/year student ID, such as S2047/0001/2026."""
    year = timezone.now().year
    prefix = f'{school.registry_number}/'
    pattern = re.compile(rf'^{re.escape(school.registry_number)}/(\d+)/{year}$', re.IGNORECASE)
    sequence = 0
    existing_ids = Student.objects.filter(student_id__startswith=prefix).values_list('student_id', flat=True)
    for existing_id in existing_ids:
        match = pattern.match(existing_id or '')
        if match:
            sequence = max(sequence, int(match.group(1)))
    return f'{school.registry_number}/{sequence + 1:04d}/{year}'


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
    student_id = models.CharField(max_length=50, unique=True, null=True, blank=True, default=None, editable=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id or 'No ID'})"

    class Meta:
        ordering = ["last_name", "first_name"]

    def save(self, *args, **kwargs):
        if not self.student_id and self.school_id:
            self.student_id = generate_student_id(self.school)
        super().save(*args, **kwargs)
