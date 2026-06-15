from rest_framework import serializers

from .models import Result, ResultDetail


class ResultDetailSerializer(serializers.ModelSerializer):
    talent_name = serializers.CharField(source='talent.talent.name', read_only=True)
    student_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ResultDetail
        fields = [
            'id',
            'talent',
            'talent_name',
            'student_name',
            'raw_score',
            'percentage_score',
            'notes',
            'recorded_at',
        ]

    def get_student_name(self, obj):
        return f"{obj.result.participation.student.first_name} {obj.result.participation.student.last_name}"


class ResultSerializer(serializers.ModelSerializer):
    participation_details = serializers.SerializerMethodField(read_only=True)
    details = ResultDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Result
        fields = [
            'id',
            'participation',
            'participation_details',
            'grade',
            'grade_points',
            'award',
            'rank',
            'venue',
            'competition_date',
            'details',
            'recorded_at',
            'updated_at',
        ]

    def get_participation_details(self, obj):
        return f"{obj.participation.student} – {obj.participation.competition}"

