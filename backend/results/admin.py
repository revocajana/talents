from django.contrib import admin
from django.utils import timezone

from .models import Result, ResultDetail, ResultPromotion


class ResultDetailInline(admin.TabularInline):
    model = ResultDetail
    extra = 1
    fields = ('talent', 'raw_score', 'percentage_score', 'notes')


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('participation', 'grade', 'award', 'rank', 'approval_status', 'competition_date')
    list_filter = ('award', 'grade', 'approval_status', 'competition_date')
    search_fields = ('participation__student__first_name', 'participation__student__last_name', 'participation__competition__name')
    readonly_fields = ('recorded_at', 'updated_at')
    inlines = [ResultDetailInline]
    actions = ('approve_results',)
    fieldsets = (
        ('Participation', {
            'fields': ('participation',)
        }),
        ('Grading', {
            'fields': ('score', 'grade', 'grade_points', 'award', 'rank', 'approval_status')
        }),
        ('Details', {
            'fields': ('venue', 'competition_date')
        }),
        ('Metadata', {
            'fields': ('approved_by', 'approved_at', 'recorded_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('grade', 'grade_points', 'approved_by', 'approved_at', 'recorded_at', 'updated_at')

    @admin.action(description='Approve selected results')
    def approve_results(self, request, queryset):
        updated = queryset.update(approval_status='approved', approved_by=request.user, approved_at=timezone.now())
        self.message_user(request, f'{updated} result(s) approved.')


@admin.register(ResultDetail)
class ResultDetailAdmin(admin.ModelAdmin):
    list_display = ('result', 'talent', 'raw_score', 'percentage_score', 'recorded_at')
    list_filter = ('talent__talent__category', 'recorded_at')
    search_fields = ('result__participation__student__first_name', 'result__participation__student__last_name')
    readonly_fields = ('recorded_at',)


@admin.register(ResultPromotion)
class ResultPromotionAdmin(admin.ModelAdmin):
    list_display = ('result', 'from_level', 'to_level', 'promoted_by', 'promoted_at')
    list_filter = ('from_level', 'to_level', 'promoted_at')
    search_fields = ('result__participation__student__first_name', 'result__participation__student__last_name')
    readonly_fields = ('promoted_by', 'promoted_at')

    def save_model(self, request, obj, form, change):
        if not obj.promoted_by_id:
            obj.promoted_by = request.user
        super().save_model(request, obj, form, change)

