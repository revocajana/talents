from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Country, Zone, Region, District, Ward, School, User
from .serializers import (
    CountrySerializer,
    ZoneSerializer,
    RegionSerializer,
    DistrictSerializer,
    WardSerializer,
    SchoolSerializer,
    UserSerializer,
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
