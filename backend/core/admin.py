from django.contrib import admin
from .models import (
    Country,
    Zone,
    Region,
    District,
    Ward,
    School,
    User,
    Parent,
)

-m 
@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "region_count")
    list_filter = ("country",)
    search_fields = ("name",)

    def region_count(self, obj):
        # Zone -> Region uses related_name='regions'
        return obj.regions.count()
    region_count.short_description = "# Regions"


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ("name", "zone", "district_count")
    list_filter = ("zone",)
    search_fields = ("name",)

    def district_count(self, obj):
        # Region -> District uses related_name='districts'
        return obj.districts.count()
    district_count.short_description = "# Districts"


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "ward_count")
    list_filter = ("region",)
    search_fields = ("name",)

    def ward_count(self, obj):
        # District -> Ward uses related_name='wards'
        return obj.wards.count()
    ward_count.short_description = "# Wards"


@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ("name", "district", "school_count")
    list_filter = ("district",)
    search_fields = ("name",)

    def school_count(self, obj):
        return obj.school_set.count()
    school_count.short_description = "# Schools"


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "registry_number",
        "ownership_type",
        "country",
        "zone",
        "region",
        "district",
        "ward",
        "student_count",
    )
    list_filter = (
        "ownership_type",
        "country",
        "zone",
        "region",
        "district",
        "ward",
    )
    search_fields = ("name", "registry_number")

    def student_count(self, obj):
        # Placeholder – replace with actual count if a Student model exists
        return getattr(obj, "student_set", None).count() if hasattr(obj, "student_set") else 0
    student_count.short_description = "# Students"


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "school")
    list_filter = ("role", "school")
    search_fields = ("username", "email")


@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ("full_name", "username", "phone", "email")
    search_fields = ("full_name", "username")
