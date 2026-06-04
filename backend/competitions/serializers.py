from rest_framework import serializers

from core.models import School
from students.models import Student
from .models import Competition, CompetitionParticipation


class CompetitionSerializer(serializers.ModelSerializer):
    schools = serializers.PrimaryKeyRelatedField(queryset=School.objects.all(), many=True)
    participants = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), many=True, required=False)
    location = serializers.SerializerMethodField()

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
        ]

    def get_location(self, obj):
        if obj.location is not None:
            return str(obj.location)
        return None


class CompetitionParticipationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompetitionParticipation
        fields = ['id', 'competition', 'student', 'joined_at', 'score', 'status']
