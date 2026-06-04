from rest_framework import serializers

from core.models import School
from .models import Student, Parent
from core.serializers import SchoolSerializer


class ParentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent
        fields = ['id', 'username', 'full_name', 'phone', 'email', 'created_at']


class StudentSerializer(serializers.ModelSerializer):
    school = SchoolSerializer(read_only=True)
    parent = ParentSerializer(read_only=True)
    school_id = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), write_only=True, source='school'
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Parent.objects.all(), write_only=True, source='parent', allow_null=True, required=False
    )

    class Meta:
        model = Student
        fields = [
            'id',
            'first_name',
            'last_name',
            'gender',
            'date_of_birth',
            'student_id',
            'school',
            'school_id',
            'parent',
            'parent_id',
        ]
