from django.contrib import admin

from .models import Result, ResultDetail


class ResultDetailInline(admin.TabularInline):
    model = ResultDetail
    extra = 1
    fields = ('talent', 'raw_score', 'percentage_score', 'notes')


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('participation', 'grade', 'award', 'rank', 'competition_date')
    list_filter = ('award', 'grade', 'competition_date')
    search_fields = ('participation__student__first_name', 'participation__student__last_name', 'participation__competition__name')
    readonly_fields = ('recorded_at', 'updated_at')
    inlines = [ResultDetailInline]
    fieldsets = (
        ('Participation', {
            'fields': ('participation',)
        }),
        ('Grading', {
            'fields': ('grade', 'grade_points', 'award', 'rank')
        }),
        ('Details', {
            'fields': ('venue', 'competition_date')
        }),
        ('Metadata', {
            'fields': ('recorded_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ResultDetail)
class ResultDetailAdmin(admin.ModelAdmin):
    list_display = ('result', 'talent', 'raw_score', 'percentage_score', 'recorded_at')
    list_filter = ('talent__talent__category', 'recorded_at')
    search_fields = ('result__participation__student__first_name', 'result__participation__student__last_name')
    readonly_fields = ('recorded_at',)

