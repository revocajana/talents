from django.db import models
from django.utils import timezone

from competitions.models import Competition, CompetitionParticipation
from students.models import Student
from core.models import StudentTalent, District, Ward, Zone, Region


class Result(models.Model):
    """Result/Outcome of a competition at a specific level."""
    GRADE_CHOICES = [
        ('A+', 'A+'),
        ('A', 'A'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B', 'B'),
        ('B-', 'B-'),
        ('C+', 'C+'),
        ('C', 'C'),
        ('C-', 'C-'),
        ('D+', 'D+'),
        ('D', 'D'),
        ('F', 'F'),
    ]

    AWARD_CHOICES = [
        ('gold', 'Gold (1st Place)'),
        ('silver', 'Silver (2nd Place)'),
        ('bronze', 'Bronze (3rd Place)'),
        ('none', 'No Award'),
    ]

    # Link to competition participation
    participation = models.OneToOneField(CompetitionParticipation, on_delete=models.CASCADE, related_name='result')
    
    # Grading and scoring
    grade = models.CharField(max_length=3, choices=GRADE_CHOICES, null=True, blank=True)
    grade_points = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    award = models.CharField(max_length=10, choices=AWARD_CHOICES, default='none')
    
    # Ranking within the competition
    rank = models.PositiveIntegerField(null=True, blank=True)
    
    # Venue/location of result
    venue = models.CharField(max_length=200, blank=True)
    
    # Dates
    competition_date = models.DateField(default=timezone.now)
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-competition_date', 'rank']
        verbose_name_plural = 'Results'

    def __str__(self):
        return f"{self.participation.student} – {self.participation.competition} [{self.award}]"

    def calculate_grade_point(self):
        """Calculate grade point based on grade."""
        grade_map = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'F': 0.0,
        }
        return grade_map.get(self.grade, None)


class ResultDetail(models.Model):
    """Detailed breakdown of a result (e.g., individual talent component scores)."""
    result = models.ForeignKey(Result, on_delete=models.CASCADE, related_name='details')
    talent = models.ForeignKey(StudentTalent, on_delete=models.CASCADE, related_name='result_details')
    
    # Scoring for this talent component
    raw_score = models.DecimalField(max_digits=5, decimal_places=2)
    percentage_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']
        verbose_name_plural = 'Result Details'

    def __str__(self):
        return f"{self.result} – {self.talent.talent.name}"

