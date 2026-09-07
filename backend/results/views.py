from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from competitions.models import Competition, CompetitionParticipation
from django.contrib.contenttypes.models import ContentType
from core.models import District
from students.models import Student

from .models import Result, ResultDetail, ResultPromotion, SchoolCompetitionSubmission
from .serializers import ResultSerializer, ResultDetailSerializer, ResultPromotionSerializer, SchoolCompetitionSubmissionSerializer
from core.permissions import AuthenticatedReadOnly, StudentDataPermission, ScopedQuerysetMixin

from core.permissions import IsSportTeacher


def ensure_school_result_editable(result):
    """Prevent school results from changing after the school submits them."""
    if SchoolCompetitionSubmission.objects.filter(
        school_id=result.participation.student.school_id,
        competition_id=result.participation.competition_id,
        status__in={'submitted', 'approved'},
    ).exists():
        from rest_framework.exceptions import ValidationError
        raise ValidationError('Submitted or approved school results are locked.')

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

    def perform_create(self, serializer):
        ensure_school_result_editable(Result(participation=serializer.validated_data['participation']))
        serializer.save()

    def perform_update(self, serializer):
        ensure_school_result_editable(self.get_object())
        serializer.save()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        result = self.get_object()
        result.approval_status = 'approved'
        result.approved_by = request.user
        result.approved_at = timezone.now()
        result.save(update_fields=['approval_status', 'approved_by', 'approved_at', 'updated_at'])
        return Response(self.get_serializer(result).data)


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

    def perform_create(self, serializer):
        ensure_school_result_editable(serializer.validated_data['result'])
        serializer.save()

    def perform_update(self, serializer):
        ensure_school_result_editable(self.get_object().result)
        serializer.save()


class ResultPromotionViewSet(viewsets.ModelViewSet):
    queryset = ResultPromotion.objects.select_related('result', 'promoted_by').all()
    serializer_class = ResultPromotionSerializer
    permission_classes = [AuthenticatedReadOnly]

    def perform_create(self, serializer):
        serializer.save(promoted_by=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[AuthenticatedReadOnly])
    def promote(self, request):
        """Promote students to next competition level."""
        detail_ids = request.data.get('result_detail_ids', [])
        student_ids = request.data.get('student_ids', [])
        competition_id = request.data.get('competition_id')
        from_level = request.data.get('from_level', 'school')
        to_level = request.data.get('to_level')  # district, zone, country
        
        if not (detail_ids or student_ids) or not competition_id or not to_level:
            return Response({
                'error': 'student_ids, competition_id, and to_level are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        valid_levels = ['district', 'zone', 'country']
        if to_level not in valid_levels:
            return Response({
                'error': f'to_level must be one of: {valid_levels}'
            }, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == 'district_manager':
            if to_level != 'district' or not request.user.district_id:
                return Response({'error': 'District managers can promote only to their assigned district.'}, status=status.HTTP_400_BAD_REQUEST)

            target_competition_id = request.data.get('district_competition_id')
            if not target_competition_id:
                return Response({'error': 'district_competition_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

            district_type = ContentType.objects.get_for_model(District)
            target_competition = Competition.objects.filter(
                id=target_competition_id,
                level='district',
            ).filter(
                Q(content_type=district_type, object_id=request.user.district_id)
                | Q(schools__district_id=request.user.district_id)
            ).first()
            if not target_competition:
                return Response({'error': 'The selected district competition does not belong to your district.'}, status=status.HTTP_404_NOT_FOUND)

            source_competition = Competition.objects.filter(
                id=competition_id,
                level='school',
                schools__district_id=request.user.district_id,
            ).first()
            if not source_competition:
                return Response({'error': 'The selected school competition does not belong to your district.'}, status=status.HTTP_404_NOT_FOUND)

            promoted = []
            errors = []
            with transaction.atomic():
                for student_id in student_ids:
                    source_participation = CompetitionParticipation.objects.filter(
                        competition=source_competition,
                        student_id=student_id,
                        student__school__district_id=request.user.district_id,
                    ).first()
                    if not source_participation:
                        errors.append(f'Student {student_id} is not registered for the selected school competition.')
                        continue
                    source_result = Result.objects.filter(participation=source_participation).first()
                    if not source_result:
                        errors.append(f'Student {student_id} has no recorded school result.')
                        continue
                    detail_scores = [
                        detail.percentage_score if detail.percentage_score is not None else detail.raw_score
                        for detail in source_result.details.all()
                    ]
                    source_score = source_result.score if source_result.score is not None else source_participation.score
                    if source_score is None and detail_scores:
                        source_score = max(detail_scores)
                    if source_score is None or source_score < 50:
                        errors.append(f'Student {student_id} must have a score of at least 50% to be promoted.')
                        continue

                    target_participation, _ = CompetitionParticipation.objects.get_or_create(
                        competition=target_competition,
                        student_id=student_id,
                        defaults={'status': 'finished', 'score': None},
                    )
                    target_participation.status = 'finished'
                    target_participation.save(update_fields=['status', 'score'])
                    target_result, _ = Result.objects.get_or_create(
                        participation=target_participation,
                        defaults={'score': None, 'approval_status': 'pending'},
                    )
                    promotion, _ = ResultPromotion.objects.get_or_create(
                        result=source_result,
                        result_detail=None,
                        to_level='district',
                        defaults={'from_level': 'school', 'promoted_by': request.user, 'notes': f'Promoted to district competition {target_competition.name}'},
                    )
                    promoted.append({'student_id': int(student_id), 'result_id': target_result.id, 'competition_id': target_competition.id, 'promotion_id': promotion.id})

            return Response({'promoted': len(promoted), 'errors': errors, 'data': promoted})
        
        # Verify competition exists and belongs to school
        competition = Competition.objects.filter(
            id=competition_id,
            schools=request.user.school
        ).first()
        
        if not competition:
            return Response({
                'error': 'Competition not found or not associated with your school'
            }, status=status.HTTP_404_NOT_FOUND)
        
        promotions = []
        errors = []
        
        with transaction.atomic():
            if detail_ids:
                details = ResultDetail.objects.select_related('result__participation__student').filter(
                    id__in=detail_ids,
                    result__participation__competition_id=competition_id,
                    result__participation__student__school=request.user.school,
                    passed=True,
                )
                for detail in details:
                    promotion = ResultPromotion.objects.create(
                        result=detail.result,
                        result_detail=detail,
                        to_level=to_level,
                        from_level=from_level,
                        promoted_by=request.user,
                        promoted_at=timezone.now(),
                    )
                    detail.promoted_to = to_level
                    detail.save(update_fields=['promoted_to'])
                    if to_level == 'district':
                        district = detail.result.participation.student.school.district
                        district_type = ContentType.objects.get_for_model(District)
                        next_competition = Competition.objects.filter(
                            level='district',
                            content_type=district_type,
                            object_id=district.pk,
                            status__in=('approved', 'pending_approval'),
                        ).order_by('start_date').first()
                        if next_competition:
                            next_participation, _ = CompetitionParticipation.objects.get_or_create(
                                competition=next_competition,
                                student=detail.result.participation.student,
                                defaults={'status': 'registered', 'score': None},
                            )
                            next_result, _ = Result.objects.get_or_create(participation=next_participation, defaults={'score': None})
                            ResultDetail.objects.get_or_create(
                                result=next_result,
                                talent=detail.talent,
                                defaults={'raw_score': detail.percentage_score or detail.raw_score, 'percentage_score': detail.percentage_score or detail.raw_score},
                            )
                    promotions.append(promotion)
            for student_id in student_ids:
                try:
                    # Check if student exists in school
                    student = Student.objects.get(id=student_id, school=request.user.school)
                    
                    # Check participation exists
                    participation = CompetitionParticipation.objects.filter(
                        competition_id=competition_id,
                        student=student
                    ).first()
                    
                    if not participation:
                        errors.append(f"Student {student_id} not registered for this competition")
                        continue
                    
                    # Create promotion
                    promotion = ResultPromotion.objects.create(
                        result_id=participation.id,  # Using participation as result source
                        to_level=to_level,
                        from_level=from_level,
                        promoted_by=request.user,
                        promoted_at=timezone.now()
                    )
                    promotions.append(promotion)
                    
                except Student.DoesNotExist:
                    errors.append(f"Student {student_id} not found in your school")
                except Exception as e:
                    errors.append(str(e))
        
        serializer = self.get_serializer(promotions, many=True)
        return Response({
            'promoted': len(promotions),
            'errors': errors,
            'data': serializer.data
        })


class SchoolCompetitionSubmissionViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = SchoolCompetitionSubmission.objects.select_related('school', 'competition').all()
    serializer_class = SchoolCompetitionSubmissionSerializer
    permission_classes = [AuthenticatedReadOnly]
    scope_paths = {'school': 'school_id', 'country': 'school__country_id', 'zone': 'school__zone_id', 'region': 'school__region_id', 'district': 'school__district_id', 'ward': 'school__ward_id'}

    def perform_create(self, serializer):
        if self.request.user.role not in {'head_teacher', 'sport_teacher'} or not self.request.user.school_id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only a school teacher can create this submission.')
        competition = serializer.validated_data['competition']
        if competition.level != 'school' or not competition.schools.filter(pk=self.request.user.school_id).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'competition': 'This competition is not available to your school.'})
        serializer.save(school=self.request.user.school)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        submission = self.get_object()
        if request.user.role not in {'head_teacher', 'sport_teacher'} or submission.school_id != request.user.school_id:
            return Response({'detail': 'Only the school teacher can submit these results.'}, status=status.HTTP_403_FORBIDDEN)
        submission.status = 'submitted'
        submission.submitted_by = request.user
        submission.submitted_at = timezone.now()
        submission.save(update_fields=['status', 'submitted_by', 'submitted_at'])
        return Response(self.get_serializer(submission).data)