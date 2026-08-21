from django.db import models
from django.core.exceptions import ValidationError
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
        ('E', 'E'),
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
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
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
    APPROVAL_CHOICES = [
        ('pending', 'Pending approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='pending')
    approved_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_results')
    approved_at = models.DateTimeField(null=True, blank=True)

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
            'D+': 1.3, 'D': 1.0, 'E': 0.5, 'F': 0.0,
        }
        return grade_map.get(self.grade, None)

    def calculate_grade(self):
        if self.score is None:
            return None
        if self.score >= 90:
            return 'A+'
        if self.score >= 75:
            return 'A'
        if self.score >= 60:
            return 'B+'
        if self.score >= 50:
            return 'B'
        if self.score >= 40:
            return 'C'
        if self.score >= 30:
            return 'D'
        if self.score >= 20:
            return 'E'
        return 'F'

    def clean(self):
        if self.score is not None and not 0 <= self.score <= 100:
            raise ValidationError({'score': 'Score must be between 0 and 100.'})
        if self.participation_id and self.score is None:
            self.score = self.participation.score
        self.grade = self.calculate_grade()
        self.grade_points = self.calculate_grade_point()
        if self.award != 'none' and self.grade and self.grade not in {'A+', 'A', 'A-', 'B+'}:
            raise ValidationError('Awards require a B+ grade or higher.')

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.participation_id:
            self.participation.score = self.score
            self.participation.save(update_fields=['score'])
        super().save(*args, **kwargs)


class ResultPromotion(models.Model):
    result = models.ForeignKey(Result, on_delete=models.CASCADE, related_name='promotions')
    from_level = models.CharField(max_length=20)
    to_level = models.CharField(max_length=20)
    promoted_by = models.ForeignKey('core.User', on_delete=models.PROTECT, related_name='result_promotions')
    promoted_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['result', 'to_level'], name='unique_result_promotion_level'),
        ]


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

