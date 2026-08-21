from rest_framework import viewsets

from .models import Result, ResultDetail
from .serializers import ResultSerializer, ResultDetailSerializer
from core.permissions import AuthenticatedReadOnly, StudentDataPermission, ScopedQuerysetMixin


class ResultViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Result.objects.select_related('participation__student', 'participation__competition').prefetch_related('details').all()
    serializer_class = ResultSerializer
    filterset_fields = ['award', 'participation__competition', 'participation__student']
    search_fields = ['participation__student__first_name', 'participation__student__last_name', 'participation__competition__name']
    ordering_fields = ['competition_date', 'rank', 'recorded_at']
    ordering = ['-competition_date', 'rank']
    permission_classes = [StudentDataPermission]

    scope_paths = {
        'student': 'participation__student_id', 'school': 'participation__student__school_id',
        'country': 'participation__student__school__country_id', 'zone': 'participation__student__school__zone_id',
        'region': 'participation__student__school__region_id', 'district': 'participation__student__school__district_id',
        'ward': 'participation__student__school__ward_id',
    }


class ResultDetailViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ResultDetail.objects.select_related('result', 'talent').all()
    serializer_class = ResultDetailSerializer
    filterset_fields = ['result', 'talent__talent__category']
    search_fields = ['result__participation__student__first_name', 'result__participation__student__last_name']
    ordering_fields = ['recorded_at']
    ordering = ['-recorded_at']
    permission_classes = [AuthenticatedReadOnly]
    scope_paths = {
        'student': 'result__participation__student_id', 'school': 'result__participation__student__school_id',
        'country': 'result__participation__student__school__country_id', 'zone': 'result__participation__student__school__zone_id',
        'region': 'result__participation__student__school__region_id', 'district': 'result__participation__student__school__district_id',
        'ward': 'result__participation__student__school__ward_id',
    }

