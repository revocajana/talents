from rest_framework import viewsets

from .models import Student, Parent
from .serializers import StudentSerializer, ParentSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('school', 'parent').all()
    serializer_class = StudentSerializer


class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
