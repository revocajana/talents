from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Q

from .models import (
    Country, Zone, Region, District, Ward, School, SchoolOwnershipType,
    User, Talent, TalentCategory, StudentTalent, Announcement, CountryClub, SchoolClub, ClubTeacher,
    StudentClubMembership, EvaluationCriterion, TalentEvaluation, EvaluationScore,
    TalentSubmission, SubmissionFeedback, Message, Notification, AuditLog,
)
from .serializers import (
    CountrySerializer,
    ZoneSerializer,
    RegionSerializer,
    DistrictSerializer,
    WardSerializer,
    SchoolSerializer,
    SchoolOwnershipTypeSerializer,
    UserSerializer,
    TalentSerializer,
    TalentCategorySerializer,
    StudentTalentSerializer,
    AnnouncementSerializer,
    CountryClubSerializer, SchoolClubSerializer, ClubTeacherSerializer,
    StudentClubMembershipSerializer, EvaluationCriterionSerializer,
    TalentEvaluationSerializer, EvaluationScoreSerializer,
    TalentSubmissionSerializer, SubmissionFeedbackSerializer,
    MessageSerializer, NotificationSerializer, AuditLogSerializer,
)
from .permissions import (
    AuthenticatedReadOnly, ConfigurationPermission, StudentDataPermission,
    SubmissionPermission, ScopedQuerysetMixin, PublicSchoolRegistrationPermission,
)


class CountryViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [PublicSchoolRegistrationPermission]
    scope_paths = {'country': 'id'}


class ZoneViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Zone.objects.select_related('country').all()
    serializer_class = ZoneSerializer
    permission_classes = [PublicSchoolRegistrationPermission]
    scope_paths = {'country': 'country_id', 'zone': 'id'}


class RegionViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Region.objects.select_related('zone').all()
    serializer_class = RegionSerializer
    permission_classes = [PublicSchoolRegistrationPermission]
    scope_paths = {'country': 'zone__country_id', 'zone': 'zone_id', 'region': 'id'}


class DistrictViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = District.objects.select_related('region').all()
    serializer_class = DistrictSerializer
    permission_classes = [PublicSchoolRegistrationPermission]
    scope_paths = {'country': 'region__zone__country_id', 'zone': 'region__zone_id', 'region': 'region_id', 'district': 'id'}


class WardViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Ward.objects.select_related('district').all()
    serializer_class = WardSerializer
    permission_classes = [PublicSchoolRegistrationPermission]
    scope_paths = {'country': 'district__region__zone__country_id', 'zone': 'district__region__zone_id', 'region': 'district__region_id', 'district': 'district_id', 'ward': 'id'}


class SchoolOwnershipTypeViewSet(viewsets.ModelViewSet):
    queryset = SchoolOwnershipType.objects.filter(is_active=True).order_by('name')
    serializer_class = SchoolOwnershipTypeSerializer
    permission_classes = [PublicSchoolRegistrationPermission]


class SchoolViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    public_registration = True
    queryset = School.objects.filter(is_approved=True).select_related('country', 'zone', 'region', 'district', 'ward')
    serializer_class = SchoolSerializer
    permission_classes = [PublicSchoolRegistrationPermission]
    scope_paths = {
        'country': 'country_id', 'zone': 'zone_id', 'region': 'region_id',
        'district': 'district_id', 'ward': 'ward_id', 'school': 'id',
    }

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user and self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser or self.request.user.role in {'talent_admin'}):
            return School.objects.select_related('country', 'zone', 'region', 'district', 'ward').all()
        return qs


class RegistrationLocationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'countries': CountrySerializer(Country.objects.all(), many=True).data,
            'zones': ZoneSerializer(Zone.objects.all(), many=True).data,
            'regions': RegionSerializer(Region.objects.all(), many=True).data,
            'districts': DistrictSerializer(District.objects.all(), many=True).data,
            'wards': WardSerializer(Ward.objects.all(), many=True).data,
        })


class UserViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = User.objects.select_related('school', 'student').all()
    serializer_class = UserSerializer
    permission_classes = [ConfigurationPermission]
    scope_paths = {'school': 'school_id'}

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def current(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """Return counts of schools and users by role."""
        return Response({
            'schools': School.objects.count(),
            'region_managers': User.objects.filter(role='region_manager').count(),
            'zone_managers': User.objects.filter(role='zone_manager').count(),
            'sport_teachers': User.objects.filter(role='sport_teacher').count(),
            'district_managers': User.objects.filter(role='district_manager').count(),
            'ward_managers': User.objects.filter(role='ward_manager').count(),
            'head_teachers': User.objects.filter(role='head_teacher').count(),
            'ward_managers': User.objects.filter(role='ward_manager').count(),
            'admins': User.objects.filter(is_staff=True, is_superuser=True).count(),
        })


class TalentCategoryViewSet(viewsets.ModelViewSet):
    queryset = TalentCategory.objects.all()
    serializer_class = TalentCategorySerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    permission_classes = [ConfigurationPermission]


class TalentViewSet(viewsets.ModelViewSet):
    queryset = Talent.objects.select_related('category').all()
    serializer_class = TalentSerializer
    filterset_fields = ['category']
    search_fields = ['name', 'description']
    permission_classes = [ConfigurationPermission]



class StudentTalentViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = StudentTalent.objects.select_related('student', 'talent').all()
    serializer_class = StudentTalentSerializer
    filterset_fields = ['talent__category', 'proficiency_level', 'student']
    search_fields = ['student__first_name', 'student__last_name', 'talent__name']
    permission_classes = [StudentDataPermission]
    scope_paths = {
        'student': 'student_id', 'school': 'student__school_id',
        'country': 'student__school__country_id', 'zone': 'student__school__zone_id',
        'region': 'student__school__region_id', 'district': 'student__school__district_id',
        'ward': 'student__school__ward_id',
    }


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    filterset_fields = ['scope', 'is_active']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'published_at']
    ordering = ['-created_at']
    permission_classes = [AuthenticatedReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role in {'sport_teacher', 'head_teacher'}:
            return queryset.filter(school_id=user.school_id, scope='school') if user.school_id else queryset.none()
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'sport_teacher':
            if not user.school_id:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'school': 'Your account is not assigned to a school.'})
            serializer.save(scope='school', school_id=user.school_id, is_active=True)
            return
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'sport_teacher':
            serializer.save(scope='school', school_id=user.school_id, is_active=True)
            return
        serializer.save()


class CountryClubViewSet(viewsets.ModelViewSet):
    queryset = CountryClub.objects.select_related('country').all()
    serializer_class = CountryClubSerializer
    permission_classes = [ConfigurationPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        country_id = self.request.query_params.get('country')
        if country_id:
            queryset = queryset.filter(country_id=country_id)
        return queryset


class SchoolClubViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = SchoolClub.objects.select_related('school', 'country_club').all()
    serializer_class = SchoolClubSerializer
    permission_classes = [AuthenticatedReadOnly]
    scope_paths = {'student': 'memberships__student_id', 'school': 'school_id', 'country': 'school__country_id', 'zone': 'school__zone_id', 'region': 'school__region_id', 'district': 'school__district_id', 'ward': 'school__ward_id'}

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        if request.user.role not in {'head_teacher', 'sport_teacher'}:
            return Response({'detail': 'Only school teachers can register clubs.'}, status=403)
        school = request.user.school
        country_club_ids = list(dict.fromkeys(request.data.get('country_club_ids') or []))
        if school is None:
            return Response({'detail': 'This teacher has no assigned school.'}, status=400)
        allowed_total = school.recommended_club_count
        current_count = SchoolClub.objects.filter(school=school, is_active=True).count()
        if current_count + len(country_club_ids) > allowed_total:
            return Response({'detail': f'This school can register up to {allowed_total} active clubs.'}, status=400)
        country_clubs = list(CountryClub.objects.filter(id__in=country_club_ids, country_id=school.country_id, is_active=True))
        if len(country_clubs) != len(country_club_ids):
            return Response({'detail': 'Choose active clubs from your school country.'}, status=400)
        existing_ids = set(SchoolClub.objects.filter(school=school, country_club_id__in=country_club_ids).values_list('country_club_id', flat=True))
        if existing_ids:
            return Response({'detail': 'One or more selected clubs are already registered for this school.'}, status=400)
        with transaction.atomic():
            SchoolClub.objects.bulk_create([
                SchoolClub(school=school, country_club=country_club, is_active=True)
                for country_club in country_clubs
            ])
        return Response({'registered': len(country_clubs)}, status=201)


class ClubTeacherViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ClubTeacher.objects.select_related('club', 'teacher').all()
    serializer_class = ClubTeacherSerializer
    permission_classes = [AuthenticatedReadOnly]
    scope_paths = {'school': 'club__school_id', 'country': 'club__school__country_id', 'zone': 'club__school__zone_id', 'region': 'club__school__region_id', 'district': 'club__school__district_id', 'ward': 'club__school__ward_id'}


class StudentClubMembershipViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = StudentClubMembership.objects.select_related('student', 'club').all()
    serializer_class = StudentClubMembershipSerializer
    permission_classes = [StudentDataPermission]
    scope_paths = {
        'student': 'student_id', 'school': 'student__school_id',
        'country': 'student__school__country_id', 'zone': 'student__school__zone_id',
        'region': 'student__school__region_id', 'district': 'student__school__district_id',
        'ward': 'student__school__ward_id',
    }


class EvaluationCriterionViewSet(viewsets.ModelViewSet):
    queryset = EvaluationCriterion.objects.select_related('talent').all()
    serializer_class = EvaluationCriterionSerializer
    permission_classes = [ConfigurationPermission]


class TalentEvaluationViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = TalentEvaluation.objects.select_related('student_talent', 'evaluator').prefetch_related('scores').all()
    serializer_class = TalentEvaluationSerializer
    permission_classes = [AuthenticatedReadOnly]
    scope_paths = {
        'student': 'student_talent__student_id', 'school': 'student_talent__student__school_id',
        'country': 'student_talent__student__school__country_id', 'zone': 'student_talent__student__school__zone_id',
        'region': 'student_talent__student__school__region_id', 'district': 'student_talent__student__school__district_id',
        'ward': 'student_talent__student__school__ward_id',
    }

    def perform_create(self, serializer):
        serializer.save(evaluator=self.request.user)


class EvaluationScoreViewSet(viewsets.ModelViewSet):
    queryset = EvaluationScore.objects.select_related('evaluation', 'criterion').all()
    serializer_class = EvaluationScoreSerializer
    permission_classes = [AuthenticatedReadOnly]


class TalentSubmissionViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = TalentSubmission.objects.select_related('student', 'talent', 'club').all()
    serializer_class = TalentSubmissionSerializer
    permission_classes = [SubmissionPermission]
    scope_paths = {
        'student': 'student_id', 'school': 'student__school_id',
        'country': 'student__school__country_id', 'zone': 'student__school__zone_id',
        'region': 'student__school__region_id', 'district': 'student__school__district_id',
        'ward': 'student__school__ward_id',
    }

    def perform_create(self, serializer):
        if self.request.user.role == 'student':
            serializer.save(student_id=self.request.user.student_id)
        else:
            serializer.save()


class SubmissionFeedbackViewSet(viewsets.ModelViewSet):
    queryset = SubmissionFeedback.objects.select_related('submission', 'author').all()
    serializer_class = SubmissionFeedbackSerializer
    permission_classes = [AuthenticatedReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related('sender', 'recipient').all()
    serializer_class = MessageSerializer
    permission_classes = [AuthenticatedReadOnly]

    def get_queryset(self):
        return self.queryset.filter(sender=self.request.user) | self.queryset.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related('recipient').all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(recipient=self.request.user)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('actor').all()
    serializer_class = AuditLogSerializer
    permission_classes = [ConfigurationPermission]

