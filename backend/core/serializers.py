from rest_framework import serializers

from .models import (
    Country, Zone, Region, District, Ward, School, SchoolOwnershipType, User,
    Talent, TalentCategory, StudentTalent, Announcement, CountryClub, SchoolClub, ClubTeacher,
    StudentClubMembership, EvaluationCriterion, TalentEvaluation, EvaluationScore,
    TalentSubmission, SubmissionFeedback, Message, Notification, AuditLog,
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


class SchoolOwnershipTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolOwnershipType
        fields = ['id', 'name', 'is_active', 'created_at']


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
            'is_approved',
            'created_at',
        ]
        read_only_fields = ['is_approved']

    def create(self, validated_data):
        validated_data['is_approved'] = False
        return super().create(validated_data)

    def validate(self, attrs):
        country = attrs.get('country')
        zone = attrs.get('zone')
        region = attrs.get('region')
        district = attrs.get('district')
        ward = attrs.get('ward')
        ownership_type = attrs.get('ownership_type')

        if ownership_type:
            active_names = set(
                SchoolOwnershipType.objects.filter(is_active=True).values_list('name', flat=True)
            )
            if ownership_type not in active_names:
                raise serializers.ValidationError({'ownership_type': 'Choose a valid school ownership type.'})

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
    school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'first_name', 'last_name', 'email',
            'role', 'school', 'school_name', 'student', 'country', 'zone', 'region', 'district', 'ward',
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


class TalentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TalentCategory
        fields = ['id', 'name', 'description', 'is_active', 'created_at']


class TalentSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Talent
        fields = ['id', 'name', 'category', 'category_name', 'description', 'student_count', 'created_at']

    def get_student_count(self, obj):
        return obj.students.count()


class StudentTalentSerializer(serializers.ModelSerializer):
    talent_name = serializers.CharField(source='talent.name', read_only=True)
    talent_category = serializers.CharField(source='talent.category.name', read_only=True)
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


class CountryClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = CountryClub
        fields = ['id', 'name', 'focus', 'description', 'country', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class SchoolClubSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='country_club.name', read_only=True)
    focus = serializers.CharField(source='country_club.focus', read_only=True)
    description = serializers.CharField(source='country_club.description', read_only=True)
    country = serializers.IntegerField(source='country_club.country_id', read_only=True)

    class Meta:
        model = SchoolClub
        fields = ['id', 'name', 'focus', 'description', 'school', 'country_club', 'country', 'is_active', 'selected_at']
        read_only_fields = ['selected_at']

    def validate(self, attrs):
        school = attrs.get('school', getattr(self.instance, 'school', None))
        country_club = attrs.get('country_club', getattr(self.instance, 'country_club', None))
        if school and country_club and school.country_id != country_club.country_id:
            raise serializers.ValidationError('A school can only select clubs from its country.')
        if school and attrs.get('is_active', getattr(self.instance, 'is_active', True)):
            existing = SchoolClub.objects.filter(school=school, is_active=True).exclude(pk=getattr(self.instance, 'pk', None)).count()
            if existing >= school.recommended_club_count:
                raise serializers.ValidationError('This school has reached its maximum club limit.')
        return attrs


class ClubTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClubTeacher
        fields = '__all__'


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


