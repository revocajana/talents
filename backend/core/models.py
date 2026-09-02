from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import AbstractUser


class Country(models.Model):
    """Top‑level country entity (e.g., Tanzania)."""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=3, unique=True)  # ISO‑alpha‑3

    def __str__(self):
        return self.name


class Zone(models.Model):
    """Geographic zone within a country (e.g., Lake Zone)."""
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="zones")
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("country", "name")

    def __str__(self):
        return f"{self.name} ({self.country.code})"


class Region(models.Model):
    """Region within a zone."""
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name="regions")
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("zone", "name")

    def __str__(self):
        return f"{self.name} – {self.zone.name}"


class District(models.Model):
    """District within a region."""
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="districts")
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("region", "name")

    def __str__(self):
        return f"{self.name} – {self.region.name}"


class Ward(models.Model):
    """Ward (sub division) within a district."""
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="wards")
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("district", "name")

    def __str__(self):
        return f"{self.name} – {self.district.name}"


class SchoolOwnershipType(models.Model):
    """Admin-managed list of values available for school ownership selection."""
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class School(models.Model):
    """Educational institution linked to geographic hierarchy."""
    registry_number = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    ownership_type = models.CharField(max_length=100, default='Government')
    country = models.ForeignKey(Country, on_delete=models.PROTECT, related_name="schools")
    zone = models.ForeignKey(Zone, on_delete=models.PROTECT, related_name="schools")
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="schools")
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name="schools")
    ward = models.ForeignKey(Ward, on_delete=models.PROTECT, related_name="schools")
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    student_count = models.PositiveIntegerField(default=0)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def recommended_club_count(self):
        enrolled_students = self.students.count() if self.pk else self.student_count
        if enrolled_students <= 200:
            return 3
        if enrolled_students < 500:
            return 5
        return 10

    def __str__(self):
        return f"{self.name} ({self.registry_number})"


class User(AbstractUser):
    """Custom user extending Django's ``AbstractUser`` with role and optional school link."""
    ROLE_CHOICES = [
        ("talent_admin", "Talent Admin"),
        ("region_manager", "Region Manager"),
        ("zone_manager", "Zone Manager"),
        ("district_manager", "District Manager"),
        ("ward_manager", "Ward Manager"),
        ("head_teacher", "Head Teacher"),
        ("sport_teacher", "Sport Teacher"),
        ("student", "Student"),
        ("parent", "Parent"),
    ]
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    student = models.OneToOneField('students.Student', on_delete=models.SET_NULL, null=True, blank=True, related_name="user")
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, related_name="scoped_users")
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name="scoped_users")
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name="scoped_users")
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True, related_name="scoped_users")
    ward = models.ForeignKey(Ward, on_delete=models.SET_NULL, null=True, blank=True, related_name="scoped_users")

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Parent(models.Model):
    """Parent accounts (separate from Django auth to keep simple)."""
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=255)  # store hashed password
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="parent_profile")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class TalentCategory(models.Model):
    """Admin-managed list of talent categories."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = "Talent Categories"

    def __str__(self):
        return self.name


class Talent(models.Model):
    """Represents a talent (e.g., Piano, Basketball, Python Programming)."""
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(TalentCategory, on_delete=models.PROTECT, related_name="talents")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.category.name})"

    class Meta:
        ordering = ['category__name', 'name']


class StudentTalent(models.Model):
    """Link a Student to one or more Talents with proficiency level."""
    from students.models import Student

    PROFICIENCY_CHOICES = [
        (1, 'Beginner'),
        (2, 'Intermediate'),
        (3, 'Advanced'),
        (4, 'Expert'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='talents')
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='students')
    proficiency_level = models.IntegerField(choices=PROFICIENCY_CHOICES, default=1)
    notes = models.TextField(blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'talent')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.student} – {self.talent} ({self.get_proficiency_level_display()})"


class Announcement(models.Model):
    """System announcements with geographic scope."""
    SCOPE_CHOICES = [
        ('national', 'National'),
        ('zone', 'Zone'),
        ('region', 'Region'),
        ('district', 'District'),
        ('school', 'School'),
    ]

    title = models.CharField(max_length=200)
    content = models.TextField()
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='national')
    
    # Geographic scoping (optional; for zone/region/district/school scope)
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements')
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements')
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements')
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements')
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.get_scope_display()})"

    class Meta:
        ordering = ['-created_at']


class CountryClub(models.Model):
    """A country-level club option that schools can select."""

    name = models.CharField(max_length=150)
    focus = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='clubs')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['country', 'name']
        constraints = [
            models.UniqueConstraint(fields=['country', 'name'], name='unique_country_club_name'),
        ]

    def __str__(self):
        return f"{self.name} ({self.country.name})"


class SchoolClub(models.Model):
    """A country club selected for use by one school."""

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='clubs')
    country_club = models.ForeignKey(CountryClub, on_delete=models.CASCADE, related_name='school_selections')
    is_active = models.BooleanField(default=True)
    selected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['school', 'country_club__name']
        constraints = [
            models.UniqueConstraint(fields=['school', 'country_club'], name='unique_school_club_selection'),
        ]

    def clean(self):
        if not self.school_id or not self.country_club_id:
            return
        if self.school.country_id != self.country_club.country_id:
            raise ValidationError('A school can only select clubs from its country.')
        if self.is_active:
            active_clubs = SchoolClub.objects.filter(school_id=self.school_id, is_active=True).exclude(pk=self.pk).count()
            if active_clubs >= self.school.recommended_club_count:
                raise ValidationError({'school': 'This school has reached its maximum club limit.'})

    def __str__(self):
        return f"{self.country_club.name} ({self.school.name})"


class ClubTeacher(models.Model):
    club = models.ForeignKey(SchoolClub, on_delete=models.CASCADE, related_name='teacher_assignments')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='club_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['club', 'teacher'], name='unique_teacher_per_club'),
        ]


class StudentClubMembership(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='club_memberships')
    club = models.ForeignKey(SchoolClub, on_delete=models.CASCADE, related_name='memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    transfer_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-joined_at']
        constraints = [
            models.UniqueConstraint(fields=['student', 'club'], name='unique_student_club_membership'),
            models.UniqueConstraint(fields=['student'], condition=models.Q(is_active=True), name='one_active_club_per_student'),
        ]

    def clean(self):
        if self.student_id and self.club_id and self.student.school_id != self.club.school_id:
            raise ValidationError('A student can only join a club in their school.')
        if self.is_active and self.student_id:
            active_membership = StudentClubMembership.objects.filter(
                student_id=self.student_id,
                is_active=True,
            ).exclude(pk=self.pk).exists()
            if active_membership:
                raise ValidationError('A student can only have one active club membership.')


class EvaluationCriterion(models.Model):
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='evaluation_criteria')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['talent', 'name']
        constraints = [
            models.UniqueConstraint(fields=['talent', 'name'], name='unique_criterion_per_talent'),
        ]

    def clean(self):
        if self.weight < 0 or self.weight > 100:
            raise ValidationError({'weight': 'Weight must be between 0 and 100.'})


class TalentEvaluation(models.Model):
    GRADE_CHOICES = [
        ('A+', 'A+'), ('A', 'A'), ('B+', 'B+'), ('B', 'B'),
        ('C', 'C'), ('D', 'D'), ('E', 'E'), ('F', 'F'),
    ]

    student_talent = models.ForeignKey(StudentTalent, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(User, on_delete=models.PROTECT, related_name='talent_evaluations')
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    grade = models.CharField(max_length=2, choices=GRADE_CHOICES, blank=True)
    passed = models.BooleanField(default=False)
    feedback = models.TextField(blank=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_grade(self):
        score = self.total_score or Decimal('0')
        if score >= 90:
            return 'A+'
        if score >= 75:
            return 'A'
        if score >= 60:
            return 'B+'
        if score >= 50:
            return 'B'
        if score >= 40:
            return 'C'
        if score >= 30:
            return 'D'
        if score >= 20:
            return 'E'
        return 'F'

    def recalculate(self):
        scores = list(self.scores.select_related('criterion').all())
        total_weight = sum((score.criterion.weight for score in scores), Decimal('0'))
        if total_weight:
            total = sum((score.score * score.criterion.weight for score in scores), Decimal('0')) / total_weight
        elif scores:
            total = sum((score.score for score in scores), Decimal('0')) / len(scores)
        else:
            total = Decimal('0')
        self.total_score = total.quantize(Decimal('0.01'))
        self.passed = self.total_score >= Decimal('50')
        self.grade = self.calculate_grade()
        type(self).objects.filter(pk=self.pk).update(
            total_score=self.total_score,
            grade=self.grade,
            passed=self.passed,
        )


class EvaluationScore(models.Model):
    evaluation = models.ForeignKey(TalentEvaluation, on_delete=models.CASCADE, related_name='scores')
    criterion = models.ForeignKey(EvaluationCriterion, on_delete=models.PROTECT, related_name='scores')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    comment = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['evaluation', 'criterion'], name='unique_score_per_criterion'),
        ]

    def clean(self):
        if self.score < 0 or self.score > 100:
            raise ValidationError({'score': 'Score must be between 0 and 100.'})
        if self.evaluation_id and self.criterion_id:
            if self.criterion.talent_id != self.evaluation.student_talent.talent_id:
                raise ValidationError({'criterion': 'Criterion must belong to the evaluated talent.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        self.evaluation.recalculate()


class TalentSubmission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='talent_submissions')
    talent = models.ForeignKey(Talent, on_delete=models.PROTECT, related_name='submissions')
    club = models.ForeignKey(SchoolClub, on_delete=models.SET_NULL, null=True, blank=True, related_name='submissions')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    media = models.FileField(upload_to='talent_submissions/', blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_submissions')


class SubmissionFeedback(models.Model):
    submission = models.ForeignKey(TalentSubmission, on_delete=models.CASCADE, related_name='feedback_entries')
    author = models.ForeignKey(User, on_delete=models.PROTECT, related_name='submission_feedback')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.PROTECT, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    subject = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']


class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    body = models.TextField()
    link = models.CharField(max_length=255, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=50)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=64, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

