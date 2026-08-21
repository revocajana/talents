from django.contrib import admin
from django import forms
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from core.models import Country, District, Region, School, Ward, Zone
from .models import Competition, CompetitionJudge, CompetitionParticipation


LOCATION_MODELS = {
    'country': (Country, 'Country'),
    'zone': (Zone, 'Zone'),
    'region': (Region, 'Region'),
    'district': (District, 'District'),
    'ward': (Ward, 'Ward'),
    'school': (School, 'School'),
}


class CompetitionAdminForm(forms.ModelForm):
    location_type = forms.ChoiceField(
        choices=[('', 'No specific location')] + [(key, label) for key, (_, label) in LOCATION_MODELS.items()],
        required=False,
        label='Location type',
    )
    location_id = forms.ChoiceField(required=False, label='Location')

    class Meta:
        model = Competition
        fields = [
            'name', 'description', 'level', 'start_date', 'end_date', 'status',
            'schools', 'location_type', 'location_id',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['location_id'].choices = [('', 'Select a location type first')]
        if self.instance and self.instance.content_type_id and self.instance.object_id:
            content_type = self.instance.content_type
            for key, (model, _) in LOCATION_MODELS.items():
                if content_type.model_class() is model:
                    self.initial['location_type'] = key
                    self.fields['location_id'].choices = [
                        (item.pk, str(item)) for item in model.objects.all().order_by('pk')
                    ]
                    self.initial['location_id'] = self.instance.object_id
                    break

        location_type = self.data.get('location_type') or self.initial.get('location_type')
        if location_type in LOCATION_MODELS:
            model = LOCATION_MODELS[location_type][0]
            self.fields['location_id'].choices = [
                ('', f'Select {LOCATION_MODELS[location_type][1].lower()}'),
                *[(item.pk, str(item)) for item in model.objects.all().order_by('pk')],
            ]

    def save(self, commit=True):
        competition = super().save(commit=False)
        location_type = self.cleaned_data.get('location_type')
        location_id = self.cleaned_data.get('location_id')
        if location_type and location_id:
            model = LOCATION_MODELS[location_type][0]
            competition.content_type = ContentType.objects.get_for_model(model)
            competition.object_id = int(location_id)
        else:
            competition.content_type = None
            competition.object_id = None
        if commit:
            competition.save()
            self.save_m2m()
        return competition


class CompetitionJudgeInline(admin.TabularInline):
    model = CompetitionJudge
    extra = 1
    fields = ('judge', 'assigned_at')
    readonly_fields = ('assigned_at',)


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    form = CompetitionAdminForm
    list_display = ('name', 'level', 'status', 'organizer', 'start_date', 'end_date', 'location', 'participant_count')
    list_filter = ('level', 'status', 'start_date')
    search_fields = ('name', 'description')
    filter_horizontal = ('schools',)
    inlines = [CompetitionJudgeInline]
    readonly_fields = ('organizer', 'approved_by', 'approved_at')
    fieldsets = (
        ('Competition', {'fields': ('name', 'description', 'level', 'start_date', 'end_date', 'status')}),
        ('Location', {'fields': ('location_type', 'location_id', 'schools')}),
        ('Workflow', {'fields': ('organizer', 'approved_by', 'approved_at')}),
    )

    actions = ('approve_competitions',)

    def save_model(self, request, obj, form, change):
        if not obj.organizer_id:
            obj.organizer = request.user
        super().save_model(request, obj, form, change)

    @admin.action(description='Approve selected competitions')
    def approve_competitions(self, request, queryset):
        updated = queryset.update(status='approved', approved_by=request.user, approved_at=timezone.now())
        self.message_user(request, f'{updated} competition(s) approved.')

    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = '# Participants'


@admin.register(CompetitionParticipation)
class CompetitionParticipationAdmin(admin.ModelAdmin):
    list_display = ('student', 'competition', 'status', 'score', 'joined_at')
    list_filter = ('status', 'competition', 'joined_at')
    search_fields = ('student__first_name', 'student__last_name', 'competition__name')
    readonly_fields = ('joined_at',)
