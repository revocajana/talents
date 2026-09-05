from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import StudentDataPermission, ConfigurationPermission, ScopedQuerysetMixin

from core.models import SchoolClub, StudentClubMembership, StudentTalent, Talent, User
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

    def perform_destroy(self, instance):
        with transaction.atomic():
            User.objects.filter(student=instance).delete()
            instance.delete()

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        if request.user.role not in {'head_teacher', 'sport_teacher'}:
            return Response({'detail': 'Only school teachers can register students.'}, status=status.HTTP_403_FORBIDDEN)
        school = request.user.school
        if school is None:
            return Response({'detail': 'This teacher has no assigned school.'}, status=status.HTTP_400_BAD_REQUEST)

        talent_ids = list(dict.fromkeys(request.data.get('talents') or []))
        if len(talent_ids) > 5:
            return Response({'talents': 'A student may have at most five talents.'}, status=status.HTTP_400_BAD_REQUEST)

        club_id = request.data.get('club') or None
        password = request.data.get('password')
        if not password:
            return Response({'password': 'A password is required.'}, status=status.HTTP_400_BAD_REQUEST)

        student_data = {
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'gender': request.data.get('gender'),
            'date_of_birth': request.data.get('date_of_birth') or None,
            'education_level_id': request.data.get('education_level_id') or None,
            'school_id': school.pk,
        }
        student_serializer = StudentSerializer(data=student_data)
        student_serializer.is_valid(raise_exception=True)

        club = None
        if club_id:
            club = SchoolClub.objects.filter(pk=club_id, school=school, is_active=True).first()
            if club is None:
                return Response({'club': 'Choose an active club registered for this school.'}, status=status.HTTP_400_BAD_REQUEST)

        talents = list(Talent.objects.filter(pk__in=talent_ids))
        if len(talents) != len(talent_ids):
            return Response({'talents': 'One or more selected talents are invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            student = student_serializer.save(school=school)
            account = User(
                username=student.student_id,
                first_name=student.first_name,
                last_name=student.last_name,
                role='student',
                school=school,
                student=student,
            )
            account.set_password(password)
            account.save()
            if club:
                StudentClubMembership.objects.create(student=student, club=club, is_active=True)
            StudentTalent.objects.bulk_create([
                StudentTalent(student=student, talent=talent, proficiency_level=1)
                for talent in talents
            ])

        return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)


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
