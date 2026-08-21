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


class School(models.Model):
    """Educational institution linked to geographic hierarchy."""
    registry_number = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    ownership_type = models.CharField(max_length=100)
    country = models.ForeignKey(Country, on_delete=models.PROTECT, related_name="schools")
    zone = models.ForeignKey(Zone, on_delete=models.PROTECT, related_name="schools")
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="schools")
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name="schools")
    ward = models.ForeignKey(Ward, on_delete=models.PROTECT, related_name="schools")
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    student_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def recommended_club_count(self):
        if self.student_count <= 200:
            return 3
        if self.student_count < 500:
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


class Talent(models.Model):
    """Represents a talent category (e.g., Music, Sports, Technology)."""
    CATEGORY_CHOICES = [
        ('music', 'Music'),
        ('sports', 'Sports'),
        ('technology', 'Technology'),
        ('arts', 'Arts'),
        ('academics', 'Academics'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    class Meta:
        ordering = ['category', 'name']


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


class Club(models.Model):
    """A school club that groups students and their related talents."""

    name = models.CharField(max_length=150)
    focus = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='clubs')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    teachers = models.ManyToManyField(User, through='ClubTeacher', related_name='managed_clubs', blank=True)
    talents = models.ManyToManyField(Talent, through='ClubTalent', related_name='clubs', blank=True)

    class Meta:
        ordering = ['school', 'name']
        constraints = [
            models.UniqueConstraint(fields=['school', 'name'], name='unique_club_name_per_school'),
        ]

    def __str__(self):
        return f"{self.name} ({self.school.name})"


class ClubTeacher(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='teacher_assignments')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='club_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['club', 'teacher'], name='unique_teacher_per_club'),
        ]


class ClubTalent(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='talent_assignments')
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='club_assignments')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['club', 'talent'], name='unique_talent_per_club'),
        ]


class StudentClubMembership(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='club_memberships')
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='memberships')
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


class TalentEvaluation(models.Model):
    student_talent = models.ForeignKey(StudentTalent, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(User, on_delete=models.PROTECT, related_name='talent_evaluations')
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passed = models.BooleanField(default=False)
    feedback = models.TextField(blank=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class EvaluationScore(models.Model):
    evaluation = models.ForeignKey(TalentEvaluation, on_delete=models.CASCADE, related_name='scores')
    criterion = models.ForeignKey(EvaluationCriterion, on_delete=models.PROTECT, related_name='scores')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    comment = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['evaluation', 'criterion'], name='unique_score_per_criterion'),
        ]


class TalentSubmission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='talent_submissions')
    talent = models.ForeignKey(Talent, on_delete=models.PROTECT, related_name='submissions')
    club = models.ForeignKey(Club, on_delete=models.SET_NULL, null=True, blank=True, related_name='submissions')
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

