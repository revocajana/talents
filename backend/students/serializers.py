from rest_framework import serializers

from core.models import School
from .models import EducationLevel, Student, Parent
from core.serializers import SchoolSerializer


class EducationLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationLevel
        fields = ['id', 'country', 'name', 'code', 'level_type', 'order', 'is_active']


class ParentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent
        fields = ['id', 'username', 'full_name', 'phone', 'email', 'created_at']


class StudentSerializer(serializers.ModelSerializer):
    school = SchoolSerializer(read_only=True)
    parent = ParentSerializer(read_only=True)
    education_level = serializers.PrimaryKeyRelatedField(read_only=True)
    school_id = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.filter(is_approved=True), write_only=True, source='school' # only allow approved schools to be assigned to students
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Parent.objects.all(), write_only=True, source='parent', allow_null=True, required=False
    )
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.filter(is_active=True),
        write_only=True,
        source='education_level',
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Student
        fields = [
            'id',
            'first_name',
            'last_name',
            'gender',
            'date_of_birth',
            'education_level',
            'education_level_id',
            'student_id',
            'school',
            'school_id',
            'parent',
            'parent_id',
        ]

    def validate(self, attrs):
        school = attrs.get('school', getattr(self.instance, 'school', None))
        education_level = attrs.get('education_level', getattr(self.instance, 'education_level', None))
        if school and education_level and school.country_id != education_level.country_id:
            raise serializers.ValidationError({'education_level_id': 'Choose an education level belonging to the school country.'})
        return attrs
