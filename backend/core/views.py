from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from .models import Country, Zone, Region, District, Ward, School, User, Talent, StudentTalent, Announcement
from .serializers import (
    CountrySerializer,
    ZoneSerializer,
    RegionSerializer,
    DistrictSerializer,
    WardSerializer,
    SchoolSerializer,
    UserSerializer,
    TalentSerializer,
    StudentTalentSerializer,
    AnnouncementSerializer,
)


class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.select_related('country').all()
    serializer_class = ZoneSerializer


class RegionViewSet(viewsets.ModelViewSet):
    queryset = Region.objects.select_related('zone').all()
    serializer_class = RegionSerializer


class DistrictViewSet(viewsets.ModelViewSet):
    queryset = District.objects.select_related('region').all()
    serializer_class = DistrictSerializer


class WardViewSet(viewsets.ModelViewSet):
    queryset = Ward.objects.select_related('district').all()
    serializer_class = WardSerializer


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.select_related('country', 'zone', 'region', 'district', 'ward').all()
    serializer_class = SchoolSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('school').all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def current(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """Return counts of schools and users by role."""
        return Response({
            'schools': School.objects.count(),
            'sport_teachers': User.objects.filter(role='sport_teacher').count(),
            'district_managers': User.objects.filter(role='district_manager').count(),
            'head_teachers': User.objects.filter(role='head_teacher').count(),
            'ward_managers': User.objects.filter(role='ward_manager').count(),
            'admins': User.objects.filter(is_staff=True, is_superuser=True).count(),
        })


class TalentViewSet(viewsets.ModelViewSet):
    queryset = Talent.objects.all()
    serializer_class = TalentSerializer
    filterset_fields = ['category']
    search_fields = ['name', 'description']


class StudentTalentViewSet(viewsets.ModelViewSet):
    queryset = StudentTalent.objects.select_related('student', 'talent').all()
    serializer_class = StudentTalentSerializer
    filterset_fields = ['talent__category', 'proficiency_level', 'student']
    search_fields = ['student__first_name', 'student__last_name', 'talent__name']


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    filterset_fields = ['scope', 'is_active']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'published_at']
    ordering = ['-created_at']

