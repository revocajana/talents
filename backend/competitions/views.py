from rest_framework import viewsets

from .models import Competition, CompetitionParticipation
from .serializers import CompetitionSerializer, CompetitionParticipationSerializer


class CompetitionViewSet(viewsets.ModelViewSet):
    queryset = Competition.objects.prefetch_related('schools', 'participants').all()
    serializer_class = CompetitionSerializer


class CompetitionParticipationViewSet(viewsets.ModelViewSet):
    queryset = CompetitionParticipation.objects.select_related('competition', 'student').all()
    serializer_class = CompetitionParticipationSerializer
