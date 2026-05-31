from django.db import models

from core.models import School, Parent


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
    # link to the school; cascade delete if school removed
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="students")
    # optional parent/guardian relationship
    parent = models.ForeignKey(Parent, on_delete=models.SET_NULL, null=True, blank=True, related_name="children")
    # optional unique identifier for the student
    student_id = models.CharField(max_length=50, unique=True, null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id or 'No ID'})"

    class Meta:
        ordering = ["last_name", "first_name"]
