from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone

from core.models import School, Country, Zone, Region, District, Ward
from students.models import Student


class Competition(models.Model):
    """A competition that can be scoped to any geographic level.

    The ``level`` field indicates the intended scope, and ``location`` is a
    GenericForeignKey pointing to the concrete model (Country, Zone, etc.).
    """

    LEVEL_CHOICES = [
        ("east_africa", "East Africa"),
        ("country", "Country"),
        ("zone", "Zone"),
        ("region", "Region"),
        ("district", "District"),
        ("ward", "Ward"),
        ("school", "School"),
    ]

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)

    # Generic relation to any geographic entity
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    location = GenericForeignKey('content_type', 'object_id')

    schools = models.ManyToManyField(School, related_name='competitions', blank=True)
    participants = models.ManyToManyField(
        Student,
        through='CompetitionParticipation',
        related_name='competitions',
        blank=True,
    )
    def __str__(self):
        return f"{self.name} ({self.get_level_display()})"

    class Meta:
        ordering = ["-start_date"]


class CompetitionParticipation(models.Model):
    """Link a Student to a Competition with extra participation data."""
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='participations')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('registered', 'Registered'),
            ('finished', 'Finished'),
            ('disqualified', 'Disqualified'),
        ],
        default='registered',
    )

    class Meta:
        unique_together = ('competition', 'student')
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.student} ↔ {self.competition} [{self.status}]"
