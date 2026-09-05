from rest_framework import viewsets
from core.permissions import StudentDataPermission, ConfigurationPermission, ScopedQuerysetMixin

from .models import EducationLevel, Student, Parent
from .serializers import EducationLevelSerializer, StudentSerializer, ParentSerializer


class StudentViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Student.objects.select_related('school', 'parent').all()
    serializer_class = StudentSerializer
    permission_classes = [StudentDataPermission]

    scope_paths = {
        'student': 'id', 'school': 'school_id', 'country': 'school__country_id',
        'zone': 'school__zone_id', 'region': 'school__region_id',
        'district': 'school__district_id', 'ward': 'school__ward_id',
    }

    def perform_create(self, serializer):
        if self.request.user.role in {'head_teacher', 'sport_teacher'}:
            serializer.save(school=self.request.user.school)
            return
        serializer.save()


class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
    permission_classes = [ConfigurationPermission]


class EducationLevelViewSet(viewsets.ModelViewSet):
    queryset = EducationLevel.objects.select_related('country').all()
    serializer_class = EducationLevelSerializer
    permission_classes = [ConfigurationPermission]
    filterset_fields = ['country', 'level_type', 'is_active']

    def get_queryset(self):
        queryset = super().get_queryset()
        country_id = self.request.query_params.get('country')
        level_type = self.request.query_params.get('level_type')
        is_active = self.request.query_params.get('is_active')
        if country_id:
            queryset = queryset.filter(country_id=country_id)
        if level_type:
            queryset = queryset.filter(level_type=level_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in {'1', 'true', 'yes'})
        return queryset
