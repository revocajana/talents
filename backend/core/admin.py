from django.contrib import admin
from django import forms
from django.http import JsonResponse, Http404
from django.urls import path

from .models import (
    Country,
    Zone,
    Region,
    District,
    Ward,
    School,
    User,
    Parent,
    Talent,
    StudentTalent,
    Announcement,
)


class RegionInline(admin.TabularInline):
    model = Region
    fk_name = 'zone'
    extra = 0
    fields = ('name',)
    readonly_fields = ('name',)
    show_change_link = True


class SchoolInline(admin.TabularInline):
    model = School
    extra = 0
    fields = ('name', 'registry_number', 'ownership_type')
    readonly_fields = ('name', 'registry_number', 'ownership_type')
    show_change_link = True


class SchoolAdminForm(forms.ModelForm):
    class Meta:
        model = School
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['zone'].queryset = Zone.objects.all().order_by('name')
        self.fields['region'].queryset = Region.objects.all().order_by('name')
        self.fields['district'].queryset = District.objects.all().order_by('name')
        self.fields['ward'].queryset = Ward.objects.all().order_by('name')

        country_id = self.data.get('country') if self.data else None
        zone_id = self.data.get('zone') if self.data else None
        region_id = self.data.get('region') if self.data else None
        district_id = self.data.get('district') if self.data else None

        if self.instance and self.instance.pk:
            country_id = country_id or self.instance.country_id
            zone_id = zone_id or self.instance.zone_id
            region_id = region_id or self.instance.region_id
            district_id = district_id or self.instance.district_id

        if country_id:
            self.fields['zone'].queryset = Zone.objects.filter(country_id=country_id).order_by('name')
            self.fields['region'].queryset = Region.objects.filter(zone__country_id=country_id).order_by('name')

        if zone_id:
            self.fields['region'].queryset = Region.objects.filter(zone_id=zone_id).order_by('name')

        if region_id:
            self.fields['district'].queryset = District.objects.filter(region_id=region_id).order_by('name')

        if district_id:
            self.fields['ward'].queryset = Ward.objects.filter(district_id=district_id).order_by('name')


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "region_list")
    list_filter = ("country",)
    search_fields = ("name",)
    inlines = [RegionInline]

    def region_list(self, obj):
        return ", ".join(obj.regions.values_list('name', flat=True))
    region_list.short_description = "Regions"


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
    inlines = [SchoolInline]

    def school_count(self, obj):
        return obj.schools.count()
    school_count.short_description = "# Schools"


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    form = SchoolAdminForm
    list_display = (
        'name',
        'registry_number',
        'ownership_type',
        'country',
        'zone',
        'region',
        'district',
        'ward',
        'student_count',
    )
    list_filter = (
        'ownership_type',
        'country',
        'zone',
        'region',
        'district',
        'ward',
    )
    search_fields = ('name', 'registry_number')

    class Media:
        js = ('admin/js/jquery.init.js', 'core/js/school_geography.js')

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('geography/', self.admin_site.admin_view(self.geography_data), name='core_school_geography'),
            path('<path:object_id>/geography/', self.admin_site.admin_view(self.geography_data), name='core_school_geography_object'),
        ]
        return custom_urls + urls

    def geography_data(self, request, object_id=None):
        country_id = request.GET.get('country_id')
        zone_id = request.GET.get('zone_id')
        region_id = request.GET.get('region_id')
        district_id = request.GET.get('district_id')
        ward_id = request.GET.get('ward_id')

        zones = Zone.objects.none()
        regions = Region.objects.none()
        districts = District.objects.none()
        wards = Ward.objects.none()
        related = {}

        if country_id:
            zones = Zone.objects.filter(country_id=country_id).order_by('name')
            regions = Region.objects.filter(zone__country_id=country_id).order_by('name')

        if zone_id:
            regions = Region.objects.filter(zone_id=zone_id).order_by('name')
            try:
                zone = Zone.objects.select_related('country').get(pk=zone_id)
                related['country_id'] = zone.country_id
                related['zone_id'] = zone_id
            except Zone.DoesNotExist:
                raise Http404

        if region_id:
            districts = District.objects.filter(region_id=region_id).order_by('name')
            try:
                region = Region.objects.select_related('zone__country').get(pk=region_id)
                related.update(
                    {
                        'country_id': region.zone.country_id,
                        'zone_id': region.zone_id,
                        'region_id': region_id,
                    }
                )
            except Region.DoesNotExist:
                raise Http404

        if district_id:
            wards = Ward.objects.filter(district_id=district_id).order_by('name')
            try:
                district = District.objects.select_related('region__zone__country').get(pk=district_id)
                related.update(
                    {
                        'country_id': district.region.zone.country_id,
                        'zone_id': district.region.zone_id,
                        'region_id': district.region_id,
                        'district_id': district_id,
                    }
                )
            except District.DoesNotExist:
                raise Http404

        if ward_id:
            try:
                ward = Ward.objects.select_related('district__region__zone__country').get(pk=ward_id)
            except Ward.DoesNotExist:
                raise Http404
            wards = Ward.objects.filter(district_id=ward.district_id).order_by('name')
            region = ward.district.region
            zone = region.zone
            related = {
                'country_id': zone.country_id,
                'zone_id': zone.pk,
                'region_id': region.pk,
                'district_id': ward.district_id,
                'ward_id': ward_id,
            }
            if not zones:
                zones = Zone.objects.filter(country_id=zone.country_id).order_by('name')
            if not regions:
                regions = Region.objects.filter(zone_id=zone.pk).order_by('name')
            if not districts:
                districts = District.objects.filter(region_id=region.pk).order_by('name')

        if not wards:
            if district_id:
                wards = Ward.objects.filter(district_id=district_id).order_by('name')
            elif region_id:
                wards = Ward.objects.filter(district__region_id=region_id).order_by('name')
            elif zone_id:
                wards = Ward.objects.filter(district__region__zone_id=zone_id).order_by('name')
            elif country_id:
                wards = Ward.objects.filter(district__region__zone__country_id=country_id).order_by('name')
            else:
                wards = Ward.objects.all().order_by('name')

        return JsonResponse(
            {
                'zones': [{'id': z.pk, 'name': str(z)} for z in zones],
                'regions': [{'id': r.pk, 'name': str(r)} for r in regions],
                'districts': [{'id': d.pk, 'name': str(d)} for d in districts],
                'wards': [{'id': w.pk, 'name': str(w)} for w in wards],
                'related': related,
            }
        )

    def student_count(self, obj):
        # Placeholder – replace with actual count if a Student model exists
        return getattr(obj, 'student_set', None).count() if hasattr(obj, 'student_set') else 0
    student_count.short_description = '# Students'


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "school")
    list_filter = ("role", "school")
    search_fields = ("username", "email")


@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ("full_name", "username", "phone", "email")
    search_fields = ("full_name", "username")


@admin.register(Talent)
class TalentAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'student_count')
    list_filter = ('category',)
    search_fields = ('name', 'description')

    def student_count(self, obj):
        return obj.students.count()
    student_count.short_description = '# Students'


@admin.register(StudentTalent)
class StudentTalentAdmin(admin.ModelAdmin):
    list_display = ('student', 'talent', 'proficiency_level', 'added_at')
    list_filter = ('talent__category', 'proficiency_level', 'added_at')
    search_fields = ('student__first_name', 'student__last_name', 'talent__name')
    readonly_fields = ('added_at',)


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'scope', 'is_active', 'created_at', 'expires_at')
    list_filter = ('scope', 'is_active', 'created_at')
    search_fields = ('title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Content', {
            'fields': ('title', 'content')
        }),
        ('Scope & Targeting', {
            'fields': ('scope', 'country', 'zone', 'region', 'district', 'school')
        }),
        ('Publishing', {
            'fields': ('is_active', 'published_at', 'expires_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

