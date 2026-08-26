from django.contrib import admin
from django import forms
from django.http import JsonResponse, Http404
from django.urls import path
from django.contrib.auth.forms import UserChangeForm
from django.core.exceptions import ValidationError

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
    Club,
    ClubTeacher,
    ClubTalent,
    StudentClubMembership,
)
from students.models import Student


admin.site.site_header = 'Super admin'
admin.site.site_title = 'Super admin'
admin.site.index_title = 'Super admin'


def get_tanzania():
    return Country.objects.filter(name__iexact='Tanzania').first() or Country.objects.filter(code__iexact='TZA').first()


class TanzaniaDefaultCountryFormMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk and not self.data.get('country'):
            tanzania = get_tanzania()
            if tanzania:
                self.initial['country'] = tanzania.pk


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


class ClubInline(admin.TabularInline):
    model = Club
    extra = 0
    fields = ('name', 'focus', 'is_active')
    show_change_link = True


class SchoolAdminForm(TanzaniaDefaultCountryFormMixin, forms.ModelForm):
    class Meta:
        model = School
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['zone'].queryset = Zone.objects.none()
        self.fields['region'].queryset = Region.objects.none()
        self.fields['district'].queryset = District.objects.none()
        self.fields['ward'].queryset = Ward.objects.none()

        country_id = (self.data.get('country') if self.data else None) or self.initial.get('country')
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

    def clean(self):
        cleaned_data = super().clean()
        country = cleaned_data.get('country')
        zone = cleaned_data.get('zone')
        region = cleaned_data.get('region')
        district = cleaned_data.get('district')
        ward = cleaned_data.get('ward')

        if zone and country and zone.country_id != country.pk:
            self.add_error('zone', 'Choose a zone belonging to the selected country.')
        if region and zone and region.zone_id != zone.pk:
            self.add_error('region', 'Choose a region belonging to the selected zone.')
        if district and region and district.region_id != region.pk:
            self.add_error('district', 'Choose a district belonging to the selected region.')
        if ward and district and ward.district_id != district.pk:
            self.add_error('ward', 'Choose a ward belonging to the selected district.')
        return cleaned_data


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")


class ZoneAdminForm(TanzaniaDefaultCountryFormMixin, forms.ModelForm):
    class Meta:
        model = Zone
        fields = '__all__'


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    form = ZoneAdminForm
    list_display = ("name", "country", "region_list")
    list_filter = ("country",)
    search_fields = ("name",)
    inlines = [RegionInline]

    def region_list(self, obj):
        return ", ".join(obj.regions.values_list('name', flat=True))
    region_list.short_description = "Regions"


class RegionAdminForm(TanzaniaDefaultCountryFormMixin, forms.ModelForm):
    country = forms.ModelChoiceField(queryset=Country.objects.all().order_by('name'), label='Country')

    class Meta:
        model = Region
        fields = ('country', 'zone', 'name')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['zone'].queryset = Zone.objects.none()

        country_id = (self.data.get('country') if self.data else None) or self.initial.get('country')
        zone_id = self.data.get('zone') if self.data else None

        if self.instance and self.instance.pk:
            zone = self.instance.zone
            country_id = country_id or zone.country_id
            zone_id = zone_id or zone.pk
            self.initial.update({
                'country': country_id,
                'zone': zone_id,
            })

        if country_id:
            self.fields['zone'].queryset = Zone.objects.filter(country_id=country_id).order_by('name')

    def clean(self):
        cleaned_data = super().clean()
        country = cleaned_data.get('country')
        zone = cleaned_data.get('zone')
        if zone and country and zone.country_id != country.pk:
            self.add_error('zone', 'Choose a zone belonging to the selected country.')
        return cleaned_data


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    form = RegionAdminForm
    list_display = ("name", "zone", "district_count")
    list_filter = ("zone",)
    search_fields = ("name",)
    fieldsets = (
        ('Location', {
            'fields': ('country', 'zone')
        }),
        ('Region', {
            'fields': ('name',)
        }),
    )
    class Media:
        js = ('admin/js/jquery.init.js', 'core/js/region_geography.js')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('zone__country')

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('geography/', self.admin_site.admin_view(self.geography_data), name='core_region_geography'),
            path('<path:object_id>/geography/', self.admin_site.admin_view(self.geography_data), name='core_region_geography_object'),
        ]
        return custom_urls + urls

    def geography_data(self, request, object_id=None):
        country_id = request.GET.get('country_id')
        zones = Zone.objects.filter(country_id=country_id) if country_id else Zone.objects.none()
        return JsonResponse({
            'zones': [{'id': item.pk, 'name': str(item)} for item in zones.order_by('name')],
        })

    def district_count(self, obj):
        # Region -> District uses related_name='districts'
        return obj.districts.count()
    district_count.short_description = "# Districts"


class DistrictAdminForm(TanzaniaDefaultCountryFormMixin, forms.ModelForm):
    country = forms.ModelChoiceField(queryset=Country.objects.all().order_by('name'), label='Country')
    zone = forms.ModelChoiceField(queryset=Zone.objects.none(), label='Zone')

    class Meta:
        model = District
        fields = ('country', 'zone', 'region', 'name')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['zone'].queryset = Zone.objects.none()
        self.fields['region'].queryset = Region.objects.none()

        country_id = (self.data.get('country') if self.data else None) or self.initial.get('country')
        zone_id = self.data.get('zone') if self.data else None
        region_id = self.data.get('region') if self.data else None

        if self.instance and self.instance.pk:
            region = self.instance.region
            country_id = country_id or region.zone.country_id
            zone_id = zone_id or region.zone_id
            region_id = region_id or region.pk
            self.initial.update({
                'country': country_id,
                'zone': zone_id,
                'region': region_id,
            })

        if country_id:
            self.fields['zone'].queryset = Zone.objects.filter(country_id=country_id).order_by('name')
        if zone_id:
            self.fields['region'].queryset = Region.objects.filter(zone_id=zone_id).order_by('name')

    def clean(self):
        cleaned_data = super().clean()
        country = cleaned_data.get('country')
        zone = cleaned_data.get('zone')
        region = cleaned_data.get('region')

        if zone and country and zone.country_id != country.pk:
            self.add_error('zone', 'Choose a zone belonging to the selected country.')
        if region and zone and region.zone_id != zone.pk:
            self.add_error('region', 'Choose a region belonging to the selected zone.')
        return cleaned_data


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    form = DistrictAdminForm
    list_display = ("name", "region_location", "ward_count")
    list_filter = ("region",)
    search_fields = ("name",)
    fieldsets = (
        ('Location', {
            'fields': ('country', 'zone', 'region')
        }),
        ('District', {
            'fields': ('name',)
        }),
    )
    class Media:
        js = ('admin/js/jquery.init.js', 'core/js/district_geography.js')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('region__zone__country')

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('geography/', self.admin_site.admin_view(self.geography_data), name='core_district_geography'),
            path('<path:object_id>/geography/', self.admin_site.admin_view(self.geography_data), name='core_district_geography_object'),
        ]
        return custom_urls + urls

    def geography_data(self, request, object_id=None):
        country_id = request.GET.get('country_id')
        zone_id = request.GET.get('zone_id')
        zones = Zone.objects.filter(country_id=country_id) if country_id else Zone.objects.none()
        regions = Region.objects.filter(zone_id=zone_id) if zone_id else Region.objects.none()
        return JsonResponse({
            'zones': [{'id': item.pk, 'name': str(item)} for item in zones.order_by('name')],
            'regions': [{'id': item.pk, 'name': str(item)} for item in regions.order_by('name')],
        })

    @admin.display(description='Region')
    def region_location(self, obj):
        return f'{obj.region.name} - {obj.region.zone.name} - {obj.region.zone.country.name}'

    def ward_count(self, obj):
        # District -> Ward uses related_name='wards'
        return obj.wards.count()
    ward_count.short_description = "# Wards"


class WardAdminForm(TanzaniaDefaultCountryFormMixin, forms.ModelForm):
    country = forms.ModelChoiceField(queryset=Country.objects.all().order_by('name'), label='Country')
    zone = forms.ModelChoiceField(queryset=Zone.objects.none(), label='Zone')
    region = forms.ModelChoiceField(queryset=Region.objects.none(), label='Region')

    class Meta:
        model = Ward
        fields = ('country', 'zone', 'region', 'district', 'name')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['zone'].queryset = Zone.objects.none()
        self.fields['region'].queryset = Region.objects.none()
        self.fields['district'].queryset = District.objects.none()

        country_id = (self.data.get('country') if self.data else None) or self.initial.get('country')
        zone_id = self.data.get('zone') if self.data else None
        region_id = self.data.get('region') if self.data else None
        district_id = self.data.get('district') if self.data else None

        if self.instance and self.instance.pk:
            district = self.instance.district
            region = district.region
            zone = region.zone
            country_id = country_id or zone.country_id
            zone_id = zone_id or zone.pk
            region_id = region_id or region.pk
            district_id = district_id or district.pk
            self.initial.update({
                'country': country_id,
                'zone': zone_id,
                'region': region_id,
                'district': district_id,
            })

        if country_id:
            self.fields['zone'].queryset = Zone.objects.filter(country_id=country_id).order_by('name')
        if zone_id:
            self.fields['region'].queryset = Region.objects.filter(zone_id=zone_id).order_by('name')
        if region_id:
            self.fields['district'].queryset = District.objects.filter(region_id=region_id).order_by('name')

    def clean(self):
        cleaned_data = super().clean()
        country = cleaned_data.get('country')
        zone = cleaned_data.get('zone')
        region = cleaned_data.get('region')
        district = cleaned_data.get('district')

        if zone and country and zone.country_id != country.pk:
            self.add_error('zone', 'Choose a zone belonging to the selected country.')
        if region and zone and region.zone_id != zone.pk:
            self.add_error('region', 'Choose a region belonging to the selected zone.')
        if district and region and district.region_id != region.pk:
            self.add_error('district', 'Choose a district belonging to the selected region.')
        return cleaned_data


@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    form = WardAdminForm
    list_display = ("name", "location", "school_count")
    list_filter = ("district",)
    search_fields = ("name",)
    inlines = [SchoolInline]
    fieldsets = (
        ('Location', {
            'fields': ('country', 'zone', 'region', 'district')
        }),
        ('Ward', {
            'fields': ('name',)
        }),
    )
    class Media:
        js = ('core/js/ward_geography.js',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('district__region__zone__country')

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('geography/', self.admin_site.admin_view(self.geography_data), name='core_ward_geography'),
            path('<path:object_id>/geography/', self.admin_site.admin_view(self.geography_data), name='core_ward_geography_object'),
        ]
        return custom_urls + urls

    def geography_data(self, request, object_id=None):
        country_id = request.GET.get('country_id')
        zone_id = request.GET.get('zone_id')
        region_id = request.GET.get('region_id')
        zones = Zone.objects.filter(country_id=country_id) if country_id else Zone.objects.none()
        regions = Region.objects.filter(zone_id=zone_id) if zone_id else Region.objects.none()
        districts = District.objects.filter(region_id=region_id) if region_id else District.objects.none()
        return JsonResponse({
            'zones': [{'id': item.pk, 'name': str(item)} for item in zones.order_by('name')],
            'regions': [{'id': item.pk, 'name': str(item)} for item in regions.order_by('name')],
            'districts': [{'id': item.pk, 'name': str(item)} for item in districts.order_by('name')],
        })

    @admin.display(description='Location')
    def location(self, obj):
        district = obj.district
        region = district.region
        return f'{obj.name} - {district.name} - {region.name} - {region.zone.name} - {region.zone.country.name}'

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
    inlines = (ClubInline,)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'country', 'zone', 'region', 'district', 'ward'
        )

    class Media:
        js = ('core/js/school_geography.js',)

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


class UserChangeFormWithPassword(UserChangeForm):
    """Custom form for user admin with password reset functionality."""
    password_new = forms.CharField(
        label="New Password",
        widget=forms.PasswordInput,
        required=False,
        help_text="Leave blank if not changing password."
    )
    password_confirm = forms.CharField(
        label="Confirm New Password",
        widget=forms.PasswordInput,
        required=False,
        help_text="Must match the new password above."
    )
    student_gender = forms.ChoiceField(choices=Student.GENDER_CHOICES, required=False, label='Gender')
    student_date_of_birth = forms.DateField(required=False, label='Date of birth', widget=forms.DateInput(attrs={'type': 'date'}))

    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'role', 'school', 'is_active', 'is_staff', 'is_superuser')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        linked_student = getattr(self.instance, 'student', None)
        if linked_student:
            self.initial['student_gender'] = linked_student.gender
            self.initial['student_date_of_birth'] = linked_student.date_of_birth

    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get('role') == 'student':
            if not cleaned_data.get('school'):
                self.add_error('school', 'A school is required for a student account.')
            if not cleaned_data.get('student_gender'):
                self.add_error('student_gender', 'Gender is required for a student account.')
        return cleaned_data

    def clean(self):
        cleaned_data = super().clean()
        password_new = cleaned_data.get('password_new')
        password_confirm = cleaned_data.get('password_confirm')

        if password_new or password_confirm:
            if not password_new:
                raise ValidationError("Please enter the new password.")
            if not password_confirm:
                raise ValidationError("Please confirm the new password.")
            if password_new != password_confirm:
                raise ValidationError("The passwords do not match.")
            if len(password_new) < 8:
                raise ValidationError("Password must be at least 8 characters long.")

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        password_new = self.cleaned_data.get('password_new')
        if password_new:
            user.set_password(password_new)
        if commit:
            user.save()
            if user.role == 'student':
                student = getattr(user, 'student', None)
                if student is None:
                    student = Student()
                student.first_name = user.first_name
                student.last_name = user.last_name
                student.gender = self.cleaned_data['student_gender']
                student.date_of_birth = self.cleaned_data.get('student_date_of_birth')
                student.school = user.school
                student.save()
                if user.student_id != student.id:
                    user.student = student
                    user.save(update_fields=['student'])
        return user


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    form = UserChangeFormWithPassword
    list_display = ("username", "email", "role", "school", "is_staff")
    list_filter = ("role", "school", "is_staff", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    readonly_fields = ("date_joined", "last_login")
    
    fieldsets = (
        ("Account Information", {
            "fields": ("username", "first_name", "last_name", "email")
        }),
        ("Role & Access", {
            "fields": ("role", "school", "is_staff", "is_superuser", "is_active")
        }),
        ("Student Profile", {
            "fields": ("student_gender", "student_date_of_birth"),
            "description": "Complete these fields when the role is Student. The student profile is created automatically."
        }),
        ("Change Password", {
            "fields": ("password_new", "password_confirm"),
            "classes": ("collapse",),
            "description": "Leave both fields blank to keep the current password unchanged."
        }),
        ("Timestamps", {
            "fields": ("date_joined", "last_login"),
            "classes": ("collapse",)
        }),
    )



@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ("full_name", "username", "phone", "email")
    search_fields = ("full_name", "username")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'first_name', 'last_name', 'school', 'gender', 'parent')
    list_filter = ('gender', 'school__country', 'school__zone', 'school__region', 'school__district', 'school__ward')
    search_fields = ('student_id', 'first_name', 'last_name', 'school__name')
    autocomplete_fields = ('school', 'parent')


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


class ClubTeacherInline(admin.TabularInline):
    model = ClubTeacher
    extra = 0
    autocomplete_fields = ('teacher',)
    readonly_fields = ('assigned_at',)


class ClubTalentInline(admin.TabularInline):
    model = ClubTalent
    extra = 0
    autocomplete_fields = ('talent',)
    readonly_fields = ('added_at',)


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ('name', 'school_location', 'focus', 'is_active', 'teacher_count', 'talent_count', 'member_count')
    list_filter = ('is_active', 'school__country', 'school__zone', 'school__region', 'school__district', 'school__ward')
    search_fields = ('name', 'focus', 'school__name', 'school__registry_number')
    autocomplete_fields = ('school',)
    readonly_fields = ('created_at', 'updated_at')
    inlines = (ClubTeacherInline, ClubTalentInline)

    @admin.display(description='School')
    def school_location(self, obj):
        school = obj.school
        return f'{school.name} - {school.ward.name} - {school.district.name} - {school.region.name}'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'school__ward__district__region__zone__country'
        ).prefetch_related(
            'teacher_assignments', 'talent_assignments', 'memberships'
        )

    @admin.display(description='Teachers')
    def teacher_count(self, obj):
        return len(obj.teacher_assignments.all())

    @admin.display(description='Talents')
    def talent_count(self, obj):
        return len(obj.talent_assignments.all())

    @admin.display(description='Members')
    def member_count(self, obj):
        return obj.memberships.filter(is_active=True).count()


@admin.register(ClubTeacher)
class ClubTeacherAdmin(admin.ModelAdmin):
    list_display = ('club', 'teacher', 'teacher_school', 'assigned_at')
    list_filter = ('club__school__country', 'club__school__zone', 'club__school__region', 'club__school')
    search_fields = ('club__name', 'club__school__name', 'teacher__username', 'teacher__first_name', 'teacher__last_name')
    autocomplete_fields = ('club', 'teacher')
    readonly_fields = ('assigned_at',)

    @admin.display(description='Teacher school')
    def teacher_school(self, obj):
        return obj.teacher.school or 'Not assigned'


@admin.register(ClubTalent)
class ClubTalentAdmin(admin.ModelAdmin):
    list_display = ('club', 'talent', 'school', 'added_at')
    list_filter = ('talent__category', 'club__school__country', 'club__school__zone', 'club__school')
    search_fields = ('club__name', 'club__school__name', 'talent__name')
    autocomplete_fields = ('club', 'talent')
    readonly_fields = ('added_at',)

    @admin.display(description='School')
    def school(self, obj):
        return obj.club.school


@admin.register(StudentClubMembership)
class StudentClubMembershipAdmin(admin.ModelAdmin):
    list_display = ('student', 'club', 'school', 'is_active', 'joined_at', 'left_at')
    list_filter = ('is_active', 'club__school__country', 'club__school__zone', 'club__school__region', 'club__school')
    search_fields = (
        'student__first_name', 'student__last_name', 'student__student_id',
        'club__name', 'club__school__name',
    )
    autocomplete_fields = ('student', 'club')
    readonly_fields = ('joined_at',)

    @admin.display(description='School')
    def school(self, obj):
        return obj.club.school


class AnnouncementAdminForm(TanzaniaDefaultCountryFormMixin, forms.ModelForm):
    ward = forms.ModelChoiceField(
        queryset=Ward.objects.none(),
        required=False,
        label='Ward (school filter)',
    )

    class Meta:
        model = Announcement
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['zone'].queryset = Zone.objects.none()
        self.fields['region'].queryset = Region.objects.none()
        self.fields['district'].queryset = District.objects.none()
        self.fields['ward'].queryset = Ward.objects.none()
        self.fields['school'].queryset = School.objects.none()

        country_id = (self.data.get('country') if self.data else None) or self.initial.get('country')
        zone_id = self.data.get('zone') if self.data else None
        region_id = self.data.get('region') if self.data else None
        district_id = self.data.get('district') if self.data else None
        ward_id = self.data.get('ward') if self.data else None

        if self.instance and self.instance.pk:
            country_id = country_id or self.instance.country_id
            zone_id = zone_id or self.instance.zone_id
            region_id = region_id or self.instance.region_id
            district_id = district_id or self.instance.district_id
            if self.instance.school_id:
                ward_id = ward_id or self.instance.school.ward_id

        if ward_id and not self.data:
            self.initial['ward'] = ward_id

        if country_id:
            self.fields['zone'].queryset = Zone.objects.filter(country_id=country_id).order_by('name')
        if zone_id:
            self.fields['region'].queryset = Region.objects.filter(zone_id=zone_id).order_by('name')
        if region_id:
            self.fields['district'].queryset = District.objects.filter(region_id=region_id).order_by('name')
        if district_id:
            self.fields['ward'].queryset = Ward.objects.filter(district_id=district_id).order_by('name')
        if ward_id:
            self.fields['school'].queryset = School.objects.filter(ward_id=ward_id).order_by('name')

    def clean(self):
        cleaned_data = super().clean()
        scope = cleaned_data.get('scope')
        allowed_fields = {
            'national': {'country'},
            'zone': {'country', 'zone'},
            'region': {'country', 'zone', 'region'},
            'district': {'country', 'zone', 'region', 'district'},
            'school': {'country', 'zone', 'region', 'district', 'school'},
        }.get(scope, set())

        for field_name in ('country', 'zone', 'region', 'district', 'school'):
            if field_name not in allowed_fields:
                cleaned_data[field_name] = None
        return cleaned_data


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    form = AnnouncementAdminForm
    list_display = ('title', 'scope', 'is_active', 'created_at', 'expires_at')
    list_filter = ('scope', 'is_active', 'created_at')
    search_fields = ('title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    class Media:
        js = ('admin/js/jquery.init.js', 'core/js/announcement_geography.js')

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('geography/', self.admin_site.admin_view(self.geography_data), name='core_announcement_geography'),
        ]
        return custom_urls + urls

    def geography_data(self, request):
        country_id = request.GET.get('country_id')
        zone_id = request.GET.get('zone_id')
        region_id = request.GET.get('region_id')
        district_id = request.GET.get('district_id')
        ward_id = request.GET.get('ward_id')

        zones = Zone.objects.filter(country_id=country_id) if country_id else Zone.objects.none()
        regions = Region.objects.filter(zone_id=zone_id) if zone_id else Region.objects.none()
        districts = District.objects.filter(region_id=region_id) if region_id else District.objects.none()
        wards = Ward.objects.filter(district_id=district_id) if district_id else Ward.objects.none()
        schools = School.objects.filter(ward_id=ward_id) if ward_id else School.objects.none()

        if country_id and zone_id:
            zones = zones.filter(pk=zone_id)
            regions = regions.filter(zone__country_id=country_id)
        if zone_id and region_id:
            regions = regions.filter(pk=region_id)
            districts = districts.filter(region__zone_id=zone_id)
        if region_id and district_id:
            districts = districts.filter(pk=district_id)
            wards = wards.filter(district__region_id=region_id)
        if district_id and ward_id:
            wards = wards.filter(pk=ward_id)
            schools = schools.filter(ward__district_id=district_id)

        return JsonResponse({
            'zones': [{'id': item.pk, 'name': str(item)} for item in zones.order_by('name')],
            'regions': [{'id': item.pk, 'name': str(item)} for item in regions.order_by('name')],
            'districts': [{'id': item.pk, 'name': str(item)} for item in districts.order_by('name')],
            'wards': [{'id': item.pk, 'name': str(item)} for item in wards.order_by('name')],
            'schools': [{'id': item.pk, 'name': str(item)} for item in schools.order_by('name')],
        })

    fieldsets = (
        ('Content', {
            'fields': ('title', 'content')
        }),
        ('Scope & Targeting', {
            'fields': ('scope', 'country', 'zone', 'region', 'district', 'ward', 'school')
        }),
        ('Publishing', {
            'fields': ('is_active', 'published_at', 'expires_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

