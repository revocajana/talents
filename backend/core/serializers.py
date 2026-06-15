from rest_framework import serializers

from .models import Country, Zone, Region, District, Ward, School, User, Talent, StudentTalent, Announcement


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name', 'code']


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ['id', 'country', 'name']


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'zone', 'name']


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'region', 'name']


class WardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ward
        fields = ['id', 'district', 'name']


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = [
            'id',
            'registry_number',
            'name',
            'ownership_type',
            'country',
            'zone',
            'region',
            'district',
            'ward',
            'phone',
            'email',
            'created_at',
        ]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'school']


class TalentSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Talent
        fields = ['id', 'name', 'category', 'description', 'student_count', 'created_at']

    def get_student_count(self, obj):
        return obj.students.count()


class StudentTalentSerializer(serializers.ModelSerializer):
    talent_name = serializers.CharField(source='talent.name', read_only=True)
    talent_category = serializers.CharField(source='talent.get_category_display', read_only=True)
    student_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StudentTalent
        fields = [
            'id',
            'student',
            'student_name',
            'talent',
            'talent_name',
            'talent_category',
            'proficiency_level',
            'notes',
            'added_at',
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


class AnnouncementSerializer(serializers.ModelSerializer):
    scope_display = serializers.CharField(source='get_scope_display', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id',
            'title',
            'content',
            'scope',
            'scope_display',
            'country',
            'zone',
            'region',
            'district',
            'school',
            'is_active',
            'published_at',
            'expires_at',
            'created_at',
            'updated_at',
        ]


class TalentSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Talent
        fields = ['id', 'name', 'category', 'description', 'student_count', 'created_at']

    def get_student_count(self, obj):
        return obj.students.count()


class StudentTalentSerializer(serializers.ModelSerializer):
    talent_name = serializers.CharField(source='talent.name', read_only=True)
    talent_category = serializers.CharField(source='talent.get_category_display', read_only=True)
    student_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StudentTalent
        fields = [
            'id',
            'student',
            'student_name',
            'talent',
            'talent_name',
            'talent_category',
            'proficiency_level',
            'notes',
            'added_at',
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


class AnnouncementSerializer(serializers.ModelSerializer):
    scope_display = serializers.CharField(source='get_scope_display', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id',
            'title',
            'content',
            'scope',
            'scope_display',
            'country',
            'zone',
            'region',
            'district',
            'school',
            'is_active',
            'published_at',
            'expires_at',
            'created_at',
            'updated_at',
        ]

