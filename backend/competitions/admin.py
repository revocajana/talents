from django.contrib import admin

from .models import Competition, CompetitionParticipation


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ('name', 'level', 'start_date', 'end_date', 'location', 'participant_count')
    list_filter = ('level', 'start_date')
    search_fields = ('name', 'description')
    filter_horizontal = ('schools',)

    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = '# Participants'


@admin.register(CompetitionParticipation)
class CompetitionParticipationAdmin(admin.ModelAdmin):
    list_display = ('student', 'competition', 'status', 'score', 'joined_at')
    list_filter = ('status', 'competition', 'joined_at')
    search_fields = ('student__first_name', 'student__last_name', 'competition__name')
    readonly_fields = ('joined_at',)
