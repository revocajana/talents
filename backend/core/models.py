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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.registry_number})"


class User(AbstractUser):
    """Custom user extending Django's ``AbstractUser`` with role and optional school link."""
    ROLE_CHOICES = [
        ("region_manager", "Region Manager"),
        ("zone_manager", "Zone Manager"),
        ("district_manager", "District Manager"),
        ("ward_manager", "Ward Manager"),
        ("head_teacher", "Head Teacher"),
        ("sport_teacher", "Sport Teacher"),
    ]
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Parent(models.Model):
    """Parent accounts (separate from Django auth to keep simple)."""
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=255)  # store hashed password
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name

