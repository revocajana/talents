from rest_framework import viewsets

from .models import Competition, CompetitionParticipation
from .serializers import CompetitionSerializer, CompetitionParticipationSerializer
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


class CompetitionParticipationViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = CompetitionParticipation.objects.select_related('competition', 'student').all()
    serializer_class = CompetitionParticipationSerializer
    permission_classes = [StudentDataPermission]
    scope_paths = {
        'student': 'student_id', 'school': 'student__school_id', 'country': 'student__school__country_id',
        'zone': 'student__school__zone_id', 'region': 'student__school__region_id',
        'district': 'student__school__district_id', 'ward': 'student__school__ward_id',
    }
