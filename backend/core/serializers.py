from rest_framework import serializers

from .models import (
    Country, Zone, Region, District, Ward, School, User, Talent, StudentTalent,
    Announcement, Club, ClubTeacher, ClubTalent, StudentClubMembership,
    EvaluationCriterion, TalentEvaluation, EvaluationScore, TalentSubmission,
    SubmissionFeedback, Message, Notification, AuditLog,
)


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

    def validate(self, attrs):
        country = attrs.get('country')
        zone = attrs.get('zone')
        region = attrs.get('region')
        district = attrs.get('district')
        ward = attrs.get('ward')

        if zone and country and zone.country_id != country.pk:
            raise serializers.ValidationError({'zone': 'Choose a zone belonging to the selected country.'})
        if region and zone and region.zone_id != zone.pk:
            raise serializers.ValidationError({'region': 'Choose a region belonging to the selected zone.'})
        if district and region and district.region_id != region.pk:
            raise serializers.ValidationError({'district': 'Choose a district belonging to the selected region.'})
        if ward and district and ward.district_id != district.pk:
            raise serializers.ValidationError({'ward': 'Choose a ward belonging to the selected district.'})
        if ward and region and ward.district.region_id != region.pk:
            raise serializers.ValidationError({'ward': 'Choose a ward belonging to the selected region.'})
        return attrs


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'first_name', 'last_name', 'email',
            'role', 'school', 'student', 'country', 'zone', 'region', 'district', 'ward',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


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

    def validate(self, attrs):
        student = attrs.get('student', getattr(self.instance, 'student', None))
        if student is None and self.initial_data.get('student'):
            student = StudentTalent._meta.get_field('student').remote_field.model.objects.get(pk=self.initial_data['student'])
        if student:
            existing = StudentTalent.objects.filter(student=student).exclude(pk=getattr(self.instance, 'pk', None)).count()
            if existing >= 5:
                raise serializers.ValidationError('A student may have at most five talents.')
        return attrs

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


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'focus', 'description', 'school', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        school = attrs.get('school', getattr(self.instance, 'school', None))
        is_active = attrs.get('is_active', getattr(self.instance, 'is_active', True))
        if school and is_active:
            existing = Club.objects.filter(school=school, is_active=True).exclude(pk=getattr(self.instance, 'pk', None)).count()
            if existing >= school.recommended_club_count:
                raise serializers.ValidationError('This school has reached its recommended club limit.')
        return attrs


class ClubTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClubTeacher
        fields = '__all__'


class ClubTalentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClubTalent
        fields = ['id', 'club', 'talent', 'added_at']
        read_only_fields = ['added_at']


class StudentClubMembershipSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.name', read_only=True)

    class Meta:
        model = StudentClubMembership
        fields = ['id', 'student', 'club', 'club_name', 'joined_at', 'left_at', 'is_active', 'transfer_reason']
        read_only_fields = ['joined_at']

    def validate(self, attrs):
        student = attrs.get('student', getattr(self.instance, 'student', None))
        club = attrs.get('club', getattr(self.instance, 'club', None))
        is_active = attrs.get('is_active', getattr(self.instance, 'is_active', True))
        if student and club and student.school_id != club.school_id:
            raise serializers.ValidationError('A student can only join a club in their school.')
        if student and is_active:
            existing = StudentClubMembership.objects.filter(student=student, is_active=True).exclude(pk=getattr(self.instance, 'pk', None)).exists()
            if existing:
                raise serializers.ValidationError('A student can only have one active club membership.')
        return attrs


class EvaluationCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriterion
        fields = '__all__'

    def validate_weight(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('Weight must be between 0 and 100.')
        return value


class EvaluationScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationScore
        fields = '__all__'

    def validate_score(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('Score must be between 0 and 100.')
        return value

    def validate(self, attrs):
        evaluation = attrs.get('evaluation', getattr(self.instance, 'evaluation', None))
        criterion = attrs.get('criterion', getattr(self.instance, 'criterion', None))
        if evaluation and criterion and criterion.talent_id != evaluation.student_talent.talent_id:
            raise serializers.ValidationError('Criterion must belong to the evaluated talent.')
        return attrs


class TalentEvaluationSerializer(serializers.ModelSerializer):
    scores = EvaluationScoreSerializer(many=True, read_only=True)

    class Meta:
        model = TalentEvaluation
        fields = '__all__'
        read_only_fields = ['total_score', 'grade', 'passed', 'evaluated_at', 'updated_at', 'evaluator']


class TalentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TalentSubmission
        fields = '__all__'
        read_only_fields = ['status', 'submitted_at', 'reviewed_at', 'reviewed_by']


class SubmissionFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubmissionFeedback
        fields = '__all__'
        read_only_fields = ['author', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender', 'created_at', 'read_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['recipient', 'created_at', 'read_at']


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['actor', 'created_at']


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

    def validate(self, attrs):
        student = attrs.get('student', getattr(self.instance, 'student', None))
        if student:
            existing = StudentTalent.objects.filter(student=student).exclude(pk=getattr(self.instance, 'pk', None)).count()
            if existing >= 5:
                raise serializers.ValidationError('A student may have at most five talents.')
        return attrs

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

