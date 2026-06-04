"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.views import (
    CountryViewSet,
    ZoneViewSet,
    RegionViewSet,
    DistrictViewSet,
    WardViewSet,
    SchoolViewSet,
    UserViewSet,
)
from students.views import StudentViewSet, ParentViewSet
from competitions.views import CompetitionViewSet, CompetitionParticipationViewSet

router = DefaultRouter()
router.register('countries', CountryViewSet)
router.register('zones', ZoneViewSet)
router.register('regions', RegionViewSet)
router.register('districts', DistrictViewSet)
router.register('wards', WardViewSet)
router.register('schools', SchoolViewSet)
router.register('users', UserViewSet)
router.register('students', StudentViewSet)
router.register('parents', ParentViewSet)
router.register('competitions', CompetitionViewSet)
router.register('participations', CompetitionParticipationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
