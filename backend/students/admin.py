from django.contrib import admin

from .models import Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "gender", "school", "parent", "student_id")
    list_filter = ("gender", "school")
    search_fields = ("first_name", "last_name", "student_id")

