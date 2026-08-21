from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Competition, CompetitionParticipation, CompetitionJudge
from .serializers import CompetitionSerializer, CompetitionParticipationSerializer, CompetitionJudgeSerializer
from core.permissions import AuthenticatedReadOnly, ScopedQuerysetMixin, StudentDataPermission


class CompetitionViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Competition.objects.prefetch_related('schools', 'participants').all()
    serializer_class = CompetitionSerializer
    permission_classes = [AuthenticatedReadOnly]
    scope_paths = {
        'student': 'participants__id', 'school': 'schools__id', 'country': 'schools__country_id',
        'zone': 'schools__zone_id', 'region': 'schools__region_id',
        'district': 'schools__district_id', 'ward': 'schools__ward_id',
    }

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        competition = self.get_object()
        competition.status = 'approved'
        competition.approved_by = request.user
        competition.approved_at = timezone.now()
        competition.save(update_fields=['status', 'approved_by', 'approved_at'])
        return Response(self.get_serializer(competition).data)


class CompetitionParticipationViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = CompetitionParticipation.objects.select_related('competition', 'student').all()
    serializer_class = CompetitionParticipationSerializer
    permission_classes = [StudentDataPermission]
    scope_paths = {
        'student': 'student_id', 'school': 'student__school_id', 'country': 'student__school__country_id',
        'zone': 'student__school__zone_id', 'region': 'student__school__region_id',
        'district': 'student__school__district_id', 'ward': 'student__school__ward_id',
    }


class CompetitionJudgeViewSet(viewsets.ModelViewSet):
    queryset = CompetitionJudge.objects.select_related('competition', 'judge').all()
    serializer_class = CompetitionJudgeSerializer
    permission_classes = [AuthenticatedReadOnly]
