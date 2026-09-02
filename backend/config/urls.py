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

from competitions.views import BulkResultUploadView

from core.views import (
    CountryViewSet,
    ZoneViewSet,
    RegionViewSet,
    DistrictViewSet,
    WardViewSet,
    SchoolViewSet,
    SchoolOwnershipTypeViewSet,
    RegistrationLocationsView,
    UserViewSet,
    TalentCategoryViewSet,
    TalentViewSet,
    StudentTalentViewSet,
    AnnouncementViewSet,
    CountryClubViewSet,
    SchoolClubViewSet,
    ClubTeacherViewSet,
    StudentClubMembershipViewSet,
    EvaluationCriterionViewSet,
    TalentEvaluationViewSet,
    EvaluationScoreViewSet,
    TalentSubmissionViewSet,
    SubmissionFeedbackViewSet,
    MessageViewSet,
    NotificationViewSet,
    AuditLogViewSet,
)
from students.views import StudentViewSet, ParentViewSet
from competitions.views import CompetitionViewSet, CompetitionParticipationViewSet, CompetitionJudgeViewSet
from results.views import ResultViewSet, ResultDetailViewSet, ResultPromotionViewSet

router = DefaultRouter()
router.register('countries', CountryViewSet)
router.register('zones', ZoneViewSet)
router.register('regions', RegionViewSet)
router.register('districts', DistrictViewSet)
router.register('wards', WardViewSet)
router.register('schools', SchoolViewSet)
router.register('school-ownership-types', SchoolOwnershipTypeViewSet)
router.register('users', UserViewSet)
router.register('students', StudentViewSet)
router.register('parents', ParentViewSet)
router.register('talent-categories', TalentCategoryViewSet)
router.register('talents', TalentViewSet)
router.register('student-talents', StudentTalentViewSet)
router.register('announcements', AnnouncementViewSet)
router.register('competitions', CompetitionViewSet)
router.register('participations', CompetitionParticipationViewSet)
router.register('competition-judges', CompetitionJudgeViewSet)
router.register('results', ResultViewSet)
router.register('result-details', ResultDetailViewSet)
router.register('result-promotions', ResultPromotionViewSet)
router.register('country-clubs', CountryClubViewSet)
router.register('clubs', SchoolClubViewSet)
router.register('club-teachers', ClubTeacherViewSet)
router.register('club-memberships', StudentClubMembershipViewSet)
router.register('evaluation-criteria', EvaluationCriterionViewSet)
router.register('evaluations', TalentEvaluationViewSet)
router.register('evaluation-scores', EvaluationScoreViewSet)
router.register('talent-submissions', TalentSubmissionViewSet)
router.register('submission-feedback', SubmissionFeedbackViewSet)
router.register('messages', MessageViewSet)
router.register('notifications', NotificationViewSet)
router.register('audit-logs', AuditLogViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/registration-locations/', RegistrationLocationsView.as_view(), name='registration_locations'),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/competitions/bulk-upload/', BulkResultUploadView.as_view(), name='bulk-upload'),
]
