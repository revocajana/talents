from rest_framework import serializers

from .models import Result, ResultDetail, ResultPromotion


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
    competition_name = serializers.CharField(source='participation.competition.name', read_only=True)
    competition_level = serializers.CharField(source='participation.competition.level', read_only=True)
    student_name = serializers.SerializerMethodField(read_only=True)
    details = ResultDetailSerializer(many=True, read_only=True)
    promotions = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Result
        fields = [
            'id',
            'participation',
            'participation_details',
            'competition_name',
            'competition_level',
            'student_name',
            'score',
            'grade',
            'grade_points',
            'award',
            'rank',
            'venue',
            'competition_date',
            'details',
            'recorded_at',
            'updated_at',
            'approval_status',
            'approved_by',
            'approved_at',
            'promotions',
        ]
        read_only_fields = ['grade', 'grade_points', 'approved_by', 'approved_at', 'promotions']

    def validate(self, attrs):
        participation = attrs.get('participation', getattr(self.instance, 'participation', None))
        score = attrs.get('score', getattr(self.instance, 'score', None))
        award = attrs.get('award', getattr(self.instance, 'award', 'none'))
        if score is not None and not 0 <= score <= 100:
            raise serializers.ValidationError({'score': 'Score must be between 0 and 100.'})
        derived_grade = Result(participation=participation, score=score).calculate_grade() if score is not None else None
        if award != 'none' and derived_grade and derived_grade not in {'A+', 'A', 'A-', 'B+'}:
            raise serializers.ValidationError('Awards require a B+ grade or higher.')
        if participation and participation.status != 'finished':
            raise serializers.ValidationError('A result can only be recorded for a finished participation.')
        return attrs

    def get_participation_details(self, obj):
        return f"{obj.participation.student} – {obj.participation.competition}"

    def get_student_name(self, obj):
        return f"{obj.participation.student.first_name} {obj.participation.student.last_name}"


class ResultPromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultPromotion
        fields = ['id', 'result', 'from_level', 'to_level', 'promoted_by', 'promoted_at', 'notes']
        read_only_fields = ['promoted_by', 'promoted_at']

    def validate(self, attrs):
        allowed = {
            'school': 'district',
            'district': 'zone',
            'zone': 'country',
        }
        if attrs.get('from_level') not in allowed or attrs.get('to_level') != allowed.get(attrs.get('from_level')):
            raise serializers.ValidationError('Results must progress from school to district to zone to country.')
        if not attrs['result'].approval_status == 'approved':
            raise serializers.ValidationError('Only approved results can be promoted.')
        if attrs['result'].grade and attrs['result'].grade not in {'A+', 'A', 'A-', 'B+'}:
            raise serializers.ValidationError('Only B+ or higher results can be promoted.')
        return attrs

