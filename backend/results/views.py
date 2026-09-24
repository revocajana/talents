from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from competitions.models import Competition, CompetitionParticipation
from django.contrib.contenttypes.models import ContentType
from core.models import Country, District, School, Zone
from students.models import Student

from .models import DistrictCompetitionSubmission, Result, ResultDetail, ResultPromotion, SchoolCompetitionSubmission
from .serializers import DistrictCompetitionSubmissionSerializer, ResultSerializer, ResultDetailSerializer, ResultPromotionSerializer, SchoolCompetitionSubmissionSerializer
from core.permissions import AuthenticatedReadOnly, StudentDataPermission, ScopedQuerysetMixin

from core.permissions import IsSportTeacher


def remove_empty_result_chain(result, participation):
    if result.details.exists():
        return
    result.delete()
    participation.delete()


def ensure_school_result_editable(result):
    """Prevent school results from changing after the school submits them."""
    if SchoolCompetitionSubmission.objects.filter(
        school_id=result.participation.student.school_id,
        competition_id=result.participation.competition_id,
        status__in={'submitted', 'approved'},
    ).exists():
        from rest_framework.exceptions import ValidationError
        raise ValidationError('Submitted or approved school results are locked.')


def ensure_result_detail_editable(result_detail):
    """Prevent promoted talents from being edited after they advance to a higher competition level."""
    if (
        getattr(result_detail, 'promoted_to', '') in {'district', 'zone', 'country'}
        or ResultPromotion.objects.filter(result_detail_id=result_detail.id, to_level__in={'district', 'zone', 'country'}).exists()
        or ResultPromotion.objects.filter(result_id=result_detail.result_id, to_level__in={'district', 'zone', 'country'}).exists()
    ):
        from rest_framework.exceptions import ValidationError
        raise ValidationError('Promoted competition results are locked.')
    if DistrictCompetitionSubmission.objects.filter(
        district_id=result_detail.result.participation.student.school.district_id,
        competition_id=result_detail.result.participation.competition_id,
        status='submitted',
    ).exists():
        from rest_framework.exceptions import ValidationError
        raise ValidationError('Submitted district results are locked.')
    ensure_school_result_editable(result_detail.result)


def ensure_result_editable(result):
    """Prevent a result from changing while any talent has advanced."""
    if ResultPromotion.objects.filter(result=result, to_level__in={'district', 'zone', 'country'}).exists():
        from rest_framework.exceptions import ValidationError
        raise ValidationError('Submitted competition results are locked until they are returned to draft.')
    if DistrictCompetitionSubmission.objects.filter(
        district_id=result.participation.student.school.district_id,
        competition_id=result.participation.competition_id,
        status='submitted',
    ).exists():
        from rest_framework.exceptions import ValidationError
        raise ValidationError('Submitted district results are locked.')
    ensure_school_result_editable(result)

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
        ensure_result_editable(self.get_object())
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
        ensure_result_detail_editable(self.get_object())
        serializer.save()


class DistrictCompetitionSubmissionViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = DistrictCompetitionSubmission.objects.select_related('district', 'competition').all()
    serializer_class = DistrictCompetitionSubmissionSerializer
    permission_classes = [AuthenticatedReadOnly]
    scope_paths = {
        'district': 'district_id',
        'zone': 'district__region__zone_id',
    }

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'district_manager' or not user.district_id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only an assigned district manager can create this submission.')
        competition = serializer.validated_data['competition']
        if competition.level != 'district':
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'competition': 'Only district competitions can be submitted.'})
        if not Competition.objects.filter(
            pk=competition.pk,
            level='district',
        ).filter(
            Q(content_type=ContentType.objects.get_for_model(District), object_id=user.district_id)
            | Q(schools__district_id=user.district_id)
        ).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'competition': 'This competition does not belong to your district.'})
        serializer.save(district_id=user.district_id)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        submission = self.get_object()
        if request.user.role != 'district_manager' or submission.district_id != request.user.district_id:
            return Response({'detail': 'Only the assigned district manager can submit these results.'}, status=status.HTTP_403_FORBIDDEN)
        submission.status = 'submitted'
        submission.submitted_by = request.user
        submission.submitted_at = timezone.now()
        submission.save(update_fields=['status', 'submitted_by', 'submitted_at'])
        return Response(self.get_serializer(submission).data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        submission = self.get_object()
        if request.user.role != 'zone_manager' or submission.district.zone_id != request.user.zone_id:
            return Response({'detail': 'Only the assigned zone manager can return these results to draft.'}, status=status.HTTP_403_FORBIDDEN)
        submission.status = 'draft'
        submission.save(update_fields=['status'])
        return Response(self.get_serializer(submission).data)


class ResultPromotionViewSet(viewsets.ModelViewSet):
    queryset = ResultPromotion.objects.select_related('result', 'promoted_by').all()
    serializer_class = ResultPromotionSerializer
    permission_classes = [AuthenticatedReadOnly]

    def perform_create(self, serializer):
        serializer.save(promoted_by=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[AuthenticatedReadOnly])
    def return_district_to_draft(self, request):
        if request.user.role != 'zone_manager' or not request.user.zone_id:
            return Response({'error': 'Only the assigned zone manager can return district results to draft.'}, status=status.HTTP_403_FORBIDDEN)

        competition_id = request.data.get('competition_id')
        zone_competition_id = request.data.get('zone_competition_id')
        if not competition_id:
            return Response({'error': 'competition_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        source_competition = Competition.objects.filter(
            id=competition_id,
            level='district',
            schools__zone_id=request.user.zone_id,
        ).first()
        if not source_competition:
            return Response({'error': 'The selected district competition does not belong to your zone.'}, status=status.HTTP_404_NOT_FOUND)

        promotions = ResultPromotion.objects.select_related(
            'result_detail',
            'result__participation__student',
        ).filter(
            result__participation__competition=source_competition,
            to_level='zone',
        )
        if not promotions.exists():
            return Response({'error': 'This district competition is already in draft.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for promotion in promotions:
                source_detail = promotion.result_detail
                student_id = promotion.result.participation.student_id
                talent_id = source_detail.talent_id if source_detail else None

                if zone_competition_id and talent_id:
                    target_participation = CompetitionParticipation.objects.filter(
                        competition_id=zone_competition_id,
                        student_id=student_id,
                    ).first()
                    if target_participation:
                        target_result = Result.objects.filter(participation=target_participation).first()
                        if target_result:
                            ResultDetail.objects.filter(result=target_result, talent_id=talent_id).delete()
                            if not target_result.details.exists():
                                target_result.delete()
                        if not CompetitionParticipation.objects.filter(pk=target_participation.pk, result__isnull=False).exists():
                            target_participation.delete()

                if source_detail:
                    ResultDetail.objects.filter(pk=source_detail.pk).update(promoted_to='')
                promotion.delete()

        return Response({'draft': True, 'competition_id': int(competition_id)})

    @action(detail=False, methods=['post'], permission_classes=[AuthenticatedReadOnly])
    def demote(self, request):
        if request.user.role == 'zone_manager' and request.user.zone_id:
            detail_ids = request.data.get('result_detail_ids', [])
            if not detail_ids:
                return Response({'error': 'result_detail_ids are required.'}, status=status.HTTP_400_BAD_REQUEST)

            promotions = ResultPromotion.objects.select_related(
                'result_detail',
                'result__participation__student',
            ).filter(
                result_detail_id__in=detail_ids,
                to_level='country',
                result__participation__competition__level='zone',
                result__participation__student__school__zone_id=request.user.zone_id,
            )
            if not promotions.exists():
                return Response({'error': 'No country promotions were found for the selected records.'}, status=status.HTTP_404_NOT_FOUND)

            demoted_ids = []
            with transaction.atomic():
                for promotion in promotions:
                    source_detail = promotion.result_detail
                    country_type = ContentType.objects.get_for_model(Country)
                    target_participation = CompetitionParticipation.objects.filter(
                        competition__level='country',
                        student_id=promotion.result.participation.student_id,
                    ).filter(
                        Q(competition__content_type=country_type, competition__object_id=request.user.country_id)
                        | Q(competition__schools__country_id=request.user.country_id),
                    ).first()
                    if target_participation:
                        target_result = Result.objects.filter(participation=target_participation).first()
                        if target_result and source_detail:
                            ResultDetail.objects.filter(result=target_result, talent_id=source_detail.talent_id).delete()
                            if not target_result.details.exists():
                                target_result.delete()
                        if not CompetitionParticipation.objects.filter(pk=target_participation.pk, result__isnull=False).exists():
                            target_participation.delete()

                    if source_detail:
                        source_detail.promoted_to = ''
                        source_detail.save(update_fields=['promoted_to'])
                        demoted_ids.append(int(source_detail.id))
                    promotion.delete()
            return Response({'demoted': len(demoted_ids), 'result_detail_ids': demoted_ids})

        if request.user.role != 'district_manager' or not request.user.district_id:
            return Response({'error': 'Only a district manager can remove a district promotion.'}, status=status.HTTP_403_FORBIDDEN)
        target_detail_ids = request.data.get('result_detail_ids', [])
        if not target_detail_ids:
            target_detail_id = request.data.get('target_detail_id')
            target_detail_ids = [target_detail_id] if target_detail_id else []
        if not target_detail_ids:
            return Response({'error': 'result_detail_ids are required.'}, status=status.HTTP_400_BAD_REQUEST)

        target_details = ResultDetail.objects.select_related(
            'result__participation__student',
        ).filter(
            id__in=target_detail_ids,
            result__participation__competition__level='district',
            result__participation__student__school__district_id=request.user.district_id,
        )
        if not target_details.exists():
            return Response({'error': 'No district talent results were found for the selected records.'}, status=status.HTTP_404_NOT_FOUND)

        demoted_ids = []
        with transaction.atomic():
            for target_detail in target_details:
                promotion = ResultPromotion.objects.filter(
                    to_level='district',
                    result_detail__talent_id=target_detail.talent_id,
                    result_detail__result__participation__student_id=target_detail.result.participation.student_id,
                    result_detail__result__participation__student__school__district_id=request.user.district_id,
                ).first()
                if not promotion:
                    continue
                demoted_detail_id = int(target_detail.pk)
                ResultDetail.objects.filter(pk=promotion.result_detail_id).update(promoted_to='')
                promotion.delete()
                target_result = target_detail.result
                target_participation = target_result.participation
                target_detail.delete()
                if not target_result.details.exists():
                    target_result.delete()
                    if not Result.objects.filter(pk=target_result.pk).exists():
                        target_participation.delete()
                demoted_ids.append(demoted_detail_id)
        return Response({'demoted': len(demoted_ids), 'result_detail_ids': demoted_ids})

    @action(detail=False, methods=['post'], permission_classes=[AuthenticatedReadOnly])
    def promote(self, request):
        """Promote students to next competition level."""
        detail_ids = request.data.get('result_detail_ids', [])
        student_ids = request.data.get('student_ids', [])
        competition_id = request.data.get('competition_id')
        from_level = request.data.get('from_level', 'school')
        to_level = request.data.get('to_level')  # district, zone, country
        
        if not competition_id or not to_level:
            return Response({
                'error': 'competition_id and to_level are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not (detail_ids or student_ids):
            allowed_auto_submit_roles = {'district_manager', 'zone_manager'}
            if request.user.role not in allowed_auto_submit_roles:
                return Response({
                    'error': 'student_ids or result_detail_ids are required'
                }, status=status.HTTP_400_BAD_REQUEST)

        valid_levels = ['district', 'zone', 'country']
        if to_level not in valid_levels:
            return Response({
                'error': f'to_level must be one of: {valid_levels}'
            }, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == 'district_manager':
            if to_level == 'district':
                if not request.user.district_id:
                    return Response({'error': 'District managers must be assigned to a district.'}, status=status.HTTP_400_BAD_REQUEST)

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

                if not detail_ids:
                    return Response({'error': 'Select talent results to promote.'}, status=status.HTTP_400_BAD_REQUEST)

                promoted = []
                errors = []
                with transaction.atomic():
                    source_details = ResultDetail.objects.select_related('result__participation__student').filter(
                        id__in=detail_ids,
                        result__participation__competition=source_competition,
                        result__participation__student__school__district_id=request.user.district_id,
                    )
                    for source_detail in source_details:
                        source_result = source_detail.result
                        source_participation = source_result.participation
                        source_score = source_detail.percentage_score if source_detail.percentage_score is not None else source_detail.raw_score
                        if source_score is None or source_score < 50:
                            errors.append(f'{source_detail.talent.talent.name} for student {source_participation.student_id} must have a score of at least 50%.')
                            continue

                        target_participation, _ = CompetitionParticipation.objects.get_or_create(
                            competition=target_competition,
                            student_id=source_participation.student_id,
                            defaults={'status': 'finished', 'score': None},
                        )
                        target_participation.status = 'finished'
                        target_participation.save(update_fields=['status', 'score'])
                        target_result, _ = Result.objects.get_or_create(
                            participation=target_participation,
                            defaults={'score': None, 'approval_status': 'pending'},
                        )
                        target_detail, _ = ResultDetail.objects.get_or_create(
                            result=target_result,
                            talent=source_detail.talent,
                            defaults={'raw_score': 0, 'percentage_score': None},
                        )
                        promotion, _ = ResultPromotion.objects.get_or_create(
                            result=source_result,
                            result_detail=source_detail,
                            to_level='district',
                            defaults={'from_level': 'school', 'promoted_by': request.user, 'notes': f'Promoted talent to district competition {target_competition.name}'},
                        )
                        ResultDetail.objects.filter(pk=source_detail.pk).update(promoted_to='district')
                        source_detail.promoted_to = 'district'
                        promoted.append({'student_id': int(source_participation.student_id), 'result_id': target_result.id, 'result_detail_id': target_detail.id, 'competition_id': target_competition.id, 'promotion_id': promotion.id})

                return Response({'promoted': len(promoted), 'errors': errors, 'data': promoted})

            if to_level == 'zone':
                if not request.user.zone_id:
                    return Response({'error': 'District managers must be assigned to a zone.'}, status=status.HTTP_400_BAD_REQUEST)

                district_type = ContentType.objects.get_for_model(District)
                source_competition = Competition.objects.filter(
                    id=competition_id,
                    level='district',
                ).filter(
                    Q(content_type=district_type, object_id=request.user.district_id)
                    | Q(schools__district_id=request.user.district_id)
                ).first()
                if not source_competition:
                    return Response({'error': 'The selected district competition does not belong to your district.'}, status=status.HTTP_404_NOT_FOUND)

                submission, _ = DistrictCompetitionSubmission.objects.get_or_create(
                    district_id=request.user.district_id,
                    competition=source_competition,
                )
                submission.status = 'submitted'
                submission.submitted_by = request.user
                submission.submitted_at = timezone.now()
                submission.save(update_fields=['status', 'submitted_by', 'submitted_at'])
                return Response({'submitted': True, 'promoted': 0, 'competition_id': source_competition.id})

                target_competition_id = request.data.get('zone_competition_id')
                zone_type = ContentType.objects.get_for_model(Zone)

                if target_competition_id:
                    target_competition = Competition.objects.filter(
                        id=target_competition_id,
                        level='zone',
                    ).filter(
                        Q(content_type=zone_type, object_id=request.user.zone_id)
                        | Q(schools__zone_id=request.user.zone_id)
                    ).first()
                    if not target_competition:
                        return Response({'error': 'The selected zone competition does not belong to your zone.'}, status=status.HTTP_404_NOT_FOUND)
                else:
                    target_competition = Competition.objects.filter(
                        level='zone',
                        content_type=zone_type,
                        object_id=request.user.zone_id,
                    ).order_by('-id').first()
                    if target_competition is None:
                        target_competition = Competition.objects.create(
                            level='zone',
                            content_type=zone_type,
                            object_id=request.user.zone_id,
                            name=f'{request.user.zone.name} Zone Competition',
                            description='Auto-created for district result submission.',
                            status='approved',
                            organizer=request.user,
                        )
                    target_competition.schools.set(School.objects.filter(zone_id=request.user.zone_id, is_approved=True))

                district_type = ContentType.objects.get_for_model(District)
                source_competition = Competition.objects.filter(
                    id=competition_id,
                    level='district',
                ).filter(
                    Q(content_type=district_type, object_id=request.user.district_id)
                    | Q(schools__district_id=request.user.district_id)
                ).first()
                if not source_competition:
                    return Response({'error': 'The selected district competition does not belong to your district.'}, status=status.HTTP_404_NOT_FOUND)

                if not detail_ids:
                    source_details = ResultDetail.objects.select_related('result__participation__student').filter(
                        result__participation__competition=source_competition,
                        result__participation__student__school__district_id=request.user.district_id,
                    )
                    detail_ids = [
                        detail.id for detail in source_details
                        if (detail.percentage_score if detail.percentage_score is not None else detail.raw_score) is not None
                        and (detail.percentage_score if detail.percentage_score is not None else detail.raw_score) >= 50
                    ]

                if not detail_ids:
                    return Response({'error': 'No qualifying district results were found to submit.'}, status=status.HTTP_400_BAD_REQUEST)

                promoted = []
                errors = []
                with transaction.atomic():
                    source_details = ResultDetail.objects.select_related('result__participation__student').filter(
                        id__in=detail_ids,
                        result__participation__competition=source_competition,
                        result__participation__student__school__district_id=request.user.district_id,
                    )
                    for source_detail in source_details:
                        source_result = source_detail.result
                        source_participation = source_result.participation
                        source_score = source_detail.percentage_score if source_detail.percentage_score is not None else source_detail.raw_score
                        if source_score is None or source_score < 50:
                            errors.append(f'{source_detail.talent.talent.name} for student {source_participation.student_id} must have a score of at least 50%.')
                            continue

                        target_participation, _ = CompetitionParticipation.objects.get_or_create(
                            competition=target_competition,
                            student_id=source_participation.student_id,
                            defaults={'status': 'finished', 'score': None},
                        )
                        target_participation.status = 'finished'
                        target_participation.save(update_fields=['status', 'score'])
                        target_result, _ = Result.objects.get_or_create(
                            participation=target_participation,
                            defaults={'score': None, 'approval_status': 'pending'},
                        )
                        target_detail, _ = ResultDetail.objects.get_or_create(
                            result=target_result,
                            talent=source_detail.talent,
                            defaults={'raw_score': 0, 'percentage_score': None},
                        )
                        promotion, _ = ResultPromotion.objects.get_or_create(
                            result=source_result,
                            result_detail=source_detail,
                            to_level='zone',
                            defaults={'from_level': 'district', 'promoted_by': request.user, 'notes': f'Promoted talent to zone competition {target_competition.name}'},
                        )
                        ResultDetail.objects.filter(pk=source_detail.pk).update(promoted_to='zone')
                        source_detail.promoted_to = 'zone'
                        promoted.append({'student_id': int(source_participation.student_id), 'result_id': target_result.id, 'result_detail_id': target_detail.id, 'competition_id': target_competition.id, 'promotion_id': promotion.id})

                return Response({'promoted': len(promoted), 'errors': errors, 'data': promoted})

            return Response({'error': 'District managers can promote only to district or zone level.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == 'zone_manager':
            if to_level == 'zone':
                target_competition_id = request.data.get('zone_competition_id') or request.data.get('district_competition_id')
                if not request.user.zone_id:
                    return Response({'error': 'Zone managers must be assigned to a zone.'}, status=status.HTTP_400_BAD_REQUEST)
                if not target_competition_id:
                    return Response({'error': 'zone_competition_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

                zone_type = ContentType.objects.get_for_model(Zone)
                target_competition = Competition.objects.filter(
                    id=target_competition_id,
                    level='zone',
                ).filter(
                    Q(content_type=zone_type, object_id=request.user.zone_id)
                    | Q(schools__zone_id=request.user.zone_id)
                ).first()
                if not target_competition:
                    return Response({'error': 'The selected zone competition does not belong to your zone.'}, status=status.HTTP_404_NOT_FOUND)

                district_type = ContentType.objects.get_for_model(District)
                source_competition = Competition.objects.filter(
                    id=competition_id,
                    level='district',
                ).filter(
                    Q(content_type=district_type, object_id__in=District.objects.filter(region__zone_id=request.user.zone_id).values_list('id', flat=True))
                    | Q(schools__zone_id=request.user.zone_id)
                ).first()
                if not source_competition:
                    return Response({'error': 'The selected district competition does not belong to your zone.'}, status=status.HTTP_404_NOT_FOUND)

                if not detail_ids:
                    source_details = ResultDetail.objects.select_related('result__participation__student').filter(
                        result__participation__competition=source_competition,
                        result__participation__student__school__zone_id=request.user.zone_id,
                    )
                    detail_ids = [
                        detail.id for detail in source_details
                        if (detail.percentage_score if detail.percentage_score is not None else detail.raw_score) is not None
                        and (detail.percentage_score if detail.percentage_score is not None else detail.raw_score) >= 50
                    ]

                if not detail_ids:
                    return Response({'error': 'No qualifying district results were found to submit.'}, status=status.HTTP_400_BAD_REQUEST)

                promoted = []
                errors = []
                with transaction.atomic():
                    source_details = ResultDetail.objects.select_related('result__participation__student').filter(
                        id__in=detail_ids,
                        result__participation__competition=source_competition,
                        result__participation__student__school__zone_id=request.user.zone_id,
                    )
                    for source_detail in source_details:
                        source_result = source_detail.result
                        source_participation = source_result.participation
                        source_score = source_detail.percentage_score if source_detail.percentage_score is not None else source_detail.raw_score
                        if source_score is None or source_score < 50:
                            errors.append(f'{source_detail.talent.talent.name} for student {source_participation.student_id} must have a score of at least 50%.')
                            continue

                        target_participation, _ = CompetitionParticipation.objects.get_or_create(
                            competition=target_competition,
                            student_id=source_participation.student_id,
                            defaults={'status': 'finished', 'score': None},
                        )
                        target_participation.status = 'finished'
                        target_participation.save(update_fields=['status', 'score'])
                        target_result, _ = Result.objects.get_or_create(
                            participation=target_participation,
                            defaults={'score': None, 'approval_status': 'pending'},
                        )
                        target_detail, _ = ResultDetail.objects.get_or_create(
                            result=target_result,
                            talent=source_detail.talent,
                            defaults={'raw_score': 0, 'percentage_score': None},
                        )
                        promotion, _ = ResultPromotion.objects.get_or_create(
                            result=source_result,
                            result_detail=source_detail,
                            to_level='zone',
                            defaults={'from_level': 'district', 'promoted_by': request.user, 'notes': f'Promoted talent to zone competition {target_competition.name}'},
                        )
                        ResultDetail.objects.filter(pk=source_detail.pk).update(promoted_to='zone')
                        source_detail.promoted_to = 'zone'
                        promoted.append({'student_id': int(source_participation.student_id), 'result_id': target_result.id, 'result_detail_id': target_detail.id, 'competition_id': target_competition.id, 'promotion_id': promotion.id})

                return Response({'promoted': len(promoted), 'errors': errors, 'data': promoted})

            if to_level != 'country' or not request.user.zone_id:
                return Response({'error': 'Zone managers can promote only to the zone or country level for their assigned zone.'}, status=status.HTTP_400_BAD_REQUEST)

            target_competition_id = request.data.get('country_competition_id')
            if not target_competition_id:
                return Response({'error': 'country_competition_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

            country_type = ContentType.objects.get_for_model(Country)
            target_competition = Competition.objects.filter(
                id=target_competition_id,
                level='country',
            ).filter(
                Q(content_type=country_type, object_id=request.user.country_id)
                | Q(schools__country_id=request.user.country_id)
            ).first()
            if not target_competition:
                return Response({'error': 'The selected country competition does not belong to your country.'}, status=status.HTTP_404_NOT_FOUND)

            source_competition = Competition.objects.filter(
                id=competition_id,
                level='zone',
            ).filter(
                Q(content_type=ContentType.objects.get_for_model(Zone), object_id=request.user.zone_id)
                | Q(schools__zone_id=request.user.zone_id)
            ).first()
            if not source_competition:
                return Response({'error': 'The selected zone competition does not belong to your zone.'}, status=status.HTTP_404_NOT_FOUND)

            if not detail_ids:
                source_details = ResultDetail.objects.select_related('result__participation__student').filter(
                    result__participation__competition=source_competition,
                    result__participation__student__school__zone_id=request.user.zone_id,
                )
                detail_ids = [
                    detail.id for detail in source_details
                    if (detail.percentage_score if detail.percentage_score is not None else detail.raw_score) is not None
                    and (detail.percentage_score if detail.percentage_score is not None else detail.raw_score) >= 50
                ]

            if not detail_ids:
                return Response({'error': 'No qualifying zone results were found to submit.'}, status=status.HTTP_400_BAD_REQUEST)

            promoted = []
            errors = []
            with transaction.atomic():
                source_details = ResultDetail.objects.select_related('result__participation__student').filter(
                    id__in=detail_ids,
                    result__participation__competition=source_competition,
                    result__participation__student__school__zone_id=request.user.zone_id,
                )
                for source_detail in source_details:
                    source_result = source_detail.result
                    source_participation = source_result.participation
                    source_score = source_detail.percentage_score if source_detail.percentage_score is not None else source_detail.raw_score
                    if source_score is None or source_score < 50:
                        errors.append(f'{source_detail.talent.talent.name} for student {source_participation.student_id} must have a score of at least 50%.')
                        continue

                    target_participation, _ = CompetitionParticipation.objects.get_or_create(
                        competition=target_competition,
                        student_id=source_participation.student_id,
                        defaults={'status': 'finished', 'score': None},
                    )
                    target_participation.status = 'finished'
                    target_participation.save(update_fields=['status', 'score'])
                    target_result, _ = Result.objects.get_or_create(
                        participation=target_participation,
                        defaults={'score': None, 'approval_status': 'pending'},
                    )
                    target_detail, _ = ResultDetail.objects.get_or_create(
                        result=target_result,
                        talent=source_detail.talent,
                        defaults={'raw_score': 0, 'percentage_score': None},
                    )
                    promotion, _ = ResultPromotion.objects.get_or_create(
                        result=source_result,
                        result_detail=source_detail,
                        to_level='country',
                        defaults={'from_level': 'zone', 'promoted_by': request.user, 'notes': f'Promoted talent to country competition {target_competition.name}'},
                    )
                    ResultDetail.objects.filter(pk=source_detail.pk).update(promoted_to='country')
                    source_detail.promoted_to = 'country'
                    promoted.append({'student_id': int(source_participation.student_id), 'result_id': target_result.id, 'result_detail_id': target_detail.id, 'competition_id': target_competition.id, 'promotion_id': promotion.id})

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
        user = self.request.user
        school = serializer.validated_data.get('school')
        competition = serializer.validated_data['competition']

        if user.role in {'head_teacher', 'sport_teacher'}:
            if not user.school_id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('Only a school teacher can create this submission.')
            if competition.level != 'school' or not competition.schools.filter(pk=user.school_id).exists():
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'competition': 'This competition is not available to your school.'})
            serializer.save(school=user.school)
            return

        if user.role == 'district_manager':
            if not user.district_id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('District managers must be assigned to a district.')
            if school is None or school.district_id != user.district_id:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'school': 'This school is not in your district.'})
            if competition.level != 'school' or not competition.schools.filter(pk=school.pk).exists():
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'competition': 'This competition is not available to the selected school.'})
            serializer.save(school=school)
            return

        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied('Only school teachers or district managers can create this submission.')

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        submission = self.get_object()
        is_school_teacher = request.user.role in {'head_teacher', 'sport_teacher'} and submission.school_id == request.user.school_id
        is_district_manager = request.user.role == 'district_manager' and submission.school.district_id == request.user.district_id
        if not (is_school_teacher or is_district_manager):
            return Response({'detail': 'Only the school teacher or assigned district manager can submit these results.'}, status=status.HTTP_403_FORBIDDEN)
        submission.status = 'submitted'
        submission.submitted_by = request.user
        submission.submitted_at = timezone.now()
        submission.save(update_fields=['status', 'submitted_by', 'submitted_at'])
        return Response(self.get_serializer(submission).data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        submission = self.get_object()
        if request.user.role != 'district_manager' or submission.school.district_id != request.user.district_id:
            return Response({'detail': 'Only the assigned district manager can reopen this submission.'}, status=status.HTTP_403_FORBIDDEN)
        district_promotions = ResultPromotion.objects.select_related(
            'result_detail',
            'result__participation__student',
        ).filter(
            result__participation__competition=submission.competition,
            to_level='district',
            result__participation__student__school_id=submission.school_id,
        )

        demoted_count = 0
        with transaction.atomic():
            for promotion in district_promotions:
                source_detail = promotion.result_detail
                if source_detail:
                    ResultDetail.objects.filter(pk=source_detail.pk).update(promoted_to='')

                student_id = promotion.result.participation.student_id
                talent_id = source_detail.talent_id if source_detail else None
                district_details = ResultDetail.objects.select_related('result__participation').filter(
                    result__participation__student_id=student_id,
                    result__participation__competition__level='district',
                    talent_id=talent_id,
                )
                for district_detail in district_details:
                    district_result = district_detail.result
                    district_participation = district_result.participation
                    downstream_promotions = ResultPromotion.objects.filter(
                        result=district_result,
                        to_level='zone',
                    )
                    for downstream_promotion in downstream_promotions:
                        zone_details = ResultDetail.objects.select_related('result__participation').filter(
                            result__participation__student_id=student_id,
                            result__participation__competition__level='zone',
                            talent_id=talent_id,
                        )
                        for zone_detail in zone_details:
                            zone_result = zone_detail.result
                            zone_participation = zone_result.participation
                            zone_detail.delete()
                            remove_empty_result_chain(zone_result, zone_participation)
                        downstream_promotion.delete()

                    district_detail.delete()
                    remove_empty_result_chain(district_result, district_participation)

                promotion.delete()
                demoted_count += 1

            submission.status = 'draft'
            submission.save(update_fields=['status'])

        data = self.get_serializer(submission).data
        data['demoted'] = demoted_count
        return Response(data)