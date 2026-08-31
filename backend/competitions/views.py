from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Competition, CompetitionParticipation, CompetitionJudge
from .serializers import CompetitionSerializer, CompetitionParticipationSerializer, CompetitionJudgeSerializer
from core.permissions import AuthenticatedReadOnly, ScopedQuerysetMixin, StudentDataPermission

import pandas as pd
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from students.models import Student

from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser
from core.permissions import IsSportTeacher


class CompetitionViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Competition.objects.prefetch_related('schools', 'participants').all()
    serializer_class = CompetitionSerializer
    permission_classes = [AuthenticatedReadOnly]
    scope_paths = {
        'student': 'participants__id', 'school': 'schools__id', 'country': 'schools__country_id',
        'zone': 'schools__zone_id', 'region': 'schools__region_id',
        'district': 'schools__district_id', 'ward': 'schools__ward_id',
    }

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        competition = self.get_object()
        competition.status = 'approved'
        competition.approved_by = request.user
        competition.approved_at = timezone.now()
        competition.save(update_fields=['status', 'approved_by', 'approved_at'])
        return Response(self.get_serializer(competition).data)

    @action(detail=False, methods=['get'], permission_classes=[IsSportTeacher])
    def school_results(self, request):
        """Get competition results for the sport teacher's school."""
        school_id = request.user.school_id
        if not school_id:
            return Response({'error': 'User has no school assigned'}, status=status.HTTP_400_BAD_REQUEST)
        
        participations = CompetitionParticipation.objects.filter(
            competition__schools=school_id
        ).select_related('student', 'competition')
        
        data = [{
            'id': p.id,
            'competition_id': p.competition.id,
            'competition_name': p.competition.name,
            'student_id': p.student.id,
            'student_name': f"{p.student.first_name} {p.student.last_name}",
            'score': p.score,
            'status': p.status,
            'joined_at': p.joined_at,
        } for p in participations]
        
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[IsSportTeacher])
    def eligible_for_promotion(self, request):
        """Get students eligible for district promotion (score >= 50%)."""
        school_id = request.user.school_id
        if not school_id:
            return Response({'error': 'User has no school assigned'}, status=status.HTTP_400_BAD_REQUEST)
        
        participations = CompetitionParticipation.objects.filter(
            competition__schools=school_id,
            score__gte=50,
            status='finished'
        ).select_related('student', 'competition')
        
        data = [{
            'participation_id': p.id,
            'student_id': p.student.id,
            'student_name': f"{p.student.first_name} {p.student.last_name}",
            'score': p.score,
            'competition_id': p.competition.id,
            'competition_name': p.competition.name,
        } for p in participations]
        
        return Response(data)
        


class CompetitionParticipationViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = CompetitionParticipation.objects.select_related('competition', 'student').all()
    serializer_class = CompetitionParticipationSerializer
    permission_classes = [StudentDataPermission]
    scope_paths = {
        'student': 'student_id', 'school': 'student__school_id', 'country': 'student__school__country_id',
        'zone': 'student__school__zone_id', 'region': 'student__school__region_id',
        'district': 'student__school__district_id', 'ward': 'student__school__ward_id',
    }


class CompetitionJudgeViewSet(viewsets.ModelViewSet):
    queryset = CompetitionJudge.objects.select_related('competition', 'judge').all()
    serializer_class = CompetitionJudgeSerializer
    permission_classes = [AuthenticatedReadOnly]


class BulkResultUploadView(APIView):
    """Upload Excel file with school competition results.
    
    Expected columns:
    - student_id (string, required)
    - competition_id (int, required) 
    - score (decimal 0-100, optional)
    - status (registered/finished/disqualified, default: finished)
    """
    permission_classes = [IsSportTeacher] # type: ignore
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file extension
        if not file.name.endswith(('.xlsx', '.xls')):
            return Response({'error': 'File must be Excel (.xlsx or .xls)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response({'error': f'Invalid Excel file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate required columns
        required_cols = ['student_id', 'competition_id']
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            return Response({'error': f'Missing required columns: {missing}'}, status=status.HTTP_400_BAD_REQUEST)

        errors = []
        created = 0
        updated = 0

        with transaction.atomic(): # type: ignore
            for index, row in df.iterrows():
                row_num = index + 2  # 1-indexed + header row
                try:
                    student = Student.objects.get(
                        student_id=str(row['student_id']),
                        school=request.user.school
                    )
                    
                    competition_id = int(row['competition_id'])
                    score = row.get('score')
                    status_val = row.get('status', 'finished')
                    
                    if status_val not in ['registered', 'finished', 'disqualified']:
                        errors.append(f"Row {row_num}: Invalid status '{status_val}'. Must be registered/finished/disqualified")
                        continue
                    
                    participation, created_flag = CompetitionParticipation.objects.update_or_create(
                        competition_id=competition_id,
                        student=student,
                        defaults={
                            'score': float(score) if pd.notna(score) else None,
                            'status': status_val
                        }
                    )
                    if created_flag:
                        created += 1
                    else:
                        updated += 1
                        
                except Student.DoesNotExist:
                    errors.append(f"Row {row_num}: Student '{row['student_id']}' not found in your school")
                except ValueError as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")

        return Response({
            'created': created,
            'updated': updated,
            'errors': errors,
            'total_rows': len(df)
        }, status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS)