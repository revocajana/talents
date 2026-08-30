from rest_framework import serializers

from core.models import School
from students.models import Student
from .models import Competition, CompetitionParticipation, CompetitionJudge


class CompetitionSerializer(serializers.ModelSerializer):
    schools = serializers.PrimaryKeyRelatedField(queryset=School.objects.filter(is_approved=True), many=True)
    participants = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), many=True, required=False)
    location = serializers.SerializerMethodField()
    judge_ids = serializers.PrimaryKeyRelatedField(source='judges', many=True, read_only=True)

    class Meta:
        model = Competition
        fields = [
            'id',
            'name',
            'description',
            'level',
            'start_date',
            'end_date',
            'content_type',
            'object_id',
            'location',
            'schools',
            'participants',
            'status',
            'organizer',
            'approved_by',
            'approved_at',
            'judge_ids',
        ]
        read_only_fields = ['organizer', 'approved_by', 'approved_at', 'judge_ids']

    def get_location(self, obj):
        if obj.location is not None:
            return str(obj.location)
        return None


class CompetitionParticipationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompetitionParticipation
        fields = ['id', 'competition', 'student', 'joined_at', 'score', 'status']
        read_only_fields = ['joined_at']

    def validate(self, attrs):
        student = attrs.get('student')
        competition = attrs.get('competition')
        if student and competition and not competition.schools.filter(pk=student.school_id).exists():
            raise serializers.ValidationError('Student must belong to a school registered for this competition.')
        if attrs.get('score') is not None and not 0 <= attrs['score'] <= 100:
            raise serializers.ValidationError({'score': 'Score must be between 0 and 100.'})
        return attrs


class CompetitionJudgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompetitionJudge
        fields = ['id', 'competition', 'judge', 'assigned_at']
        read_only_fields = ['assigned_at']
