from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from competitions.models import Competition, CompetitionParticipation
from students.models import Student

from .models import Result, ResultDetail, ResultPromotion
from .serializers import ResultSerializer, ResultDetailSerializer, ResultPromotionSerializer
from core.permissions import AuthenticatedReadOnly, StudentDataPermission, ScopedQuerysetMixin

from core.permissions import IsSportTeacher

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


class ResultPromotionViewSet(viewsets.ModelViewSet):
    queryset = ResultPromotion.objects.select_related('result', 'promoted_by').all()
    serializer_class = ResultPromotionSerializer
    permission_classes = [AuthenticatedReadOnly]

    def perform_create(self, serializer):
        serializer.save(promoted_by=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[IsSportTeacher])
    def promote(self, request):
        """Promote students to next competition level."""
        student_ids = request.data.get('student_ids', [])
        competition_id = request.data.get('competition_id')
        from_level = request.data.get('from_level', 'school')
        to_level = request.data.get('to_level')  # district, zone, country
        
        if not student_ids or not competition_id or not to_level:
            return Response({
                'error': 'student_ids, competition_id, and to_level are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        valid_levels = ['district', 'zone', 'country']
        if to_level not in valid_levels:
            return Response({
                'error': f'to_level must be one of: {valid_levels}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
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