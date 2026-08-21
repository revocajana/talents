from rest_framework import viewsets
from core.permissions import StudentDataPermission, ConfigurationPermission, ScopedQuerysetMixin

from .models import Student, Parent
from .serializers import StudentSerializer, ParentSerializer


class StudentViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Student.objects.select_related('school', 'parent').all()
    serializer_class = StudentSerializer
    permission_classes = [StudentDataPermission]

    scope_paths = {
        'student': 'id', 'school': 'school_id', 'country': 'school__country_id',
        'zone': 'school__zone_id', 'region': 'school__region_id',
        'district': 'school__district_id', 'ward': 'school__ward_id',
    }


class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
    permission_classes = [ConfigurationPermission]
