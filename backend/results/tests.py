from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from competitions.models import Competition, CompetitionParticipation
from core.models import Country, District, Region, School, Talent, TalentCategory, User, Ward, Zone
from results.models import Result, ResultDetail
from results.views import ResultPromotionViewSet
from students.models import Student


class ZoneToCountryPromotionTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.country = Country.objects.create(name='Test Country', code='TST')
        self.zone = Zone.objects.create(country=self.country, name='Test Zone')
        self.region = Region.objects.create(zone=self.zone, name='Test Region')
        self.district = District.objects.create(region=self.region, name='Test District')
        self.ward = Ward.objects.create(district=self.district, name='Test Ward')
        self.school = School.objects.create(
            registry_number='TZ-001',
            name='Test School',
            ownership_type='Government',
            country=self.country,
            zone=self.zone,
            region=self.region,
            district=self.district,
            ward=self.ward,
        )
        self.student = Student.objects.create(
            first_name='Jane',
            last_name='Student',
            gender='F',
            school=self.school,
        )
        self.talent_category = TalentCategory.objects.create(name='Sports')
        self.talent = Talent.objects.create(name='Swimming', category=self.talent_category)
        self.student_talent = self.student.talents.create(talent=self.talent, proficiency_level=3)
        self.zone_manager = User.objects.create_user(
            username='zone-manager',
            password='secret123',
            role='zone_manager',
            country=self.country,
            zone=self.zone,
        )
        self.country_competition = Competition.objects.create(
            name='Country Trials',
            level='country',
            status='approved',
        )
        self.country_competition.content_type = ContentType.objects.get_for_model(Country)
        self.country_competition.object_id = self.country.pk
        self.country_competition.save(update_fields=['content_type', 'object_id'])

        self.zone_competition = Competition.objects.create(
            name='Zone Trials',
            level='zone',
            status='approved',
        )
        self.zone_competition.content_type = ContentType.objects.get_for_model(Zone)
        self.zone_competition.object_id = self.zone.pk
        self.zone_competition.schools.add(self.school)
        self.zone_competition.save(update_fields=['content_type', 'object_id'])

        self.participation = CompetitionParticipation.objects.create(
            competition=self.zone_competition,
            student=self.student,
            score=78,
            status='finished',
        )
        self.result = Result.objects.create(participation=self.participation, score=78, approval_status='pending')
        self.result_detail = ResultDetail.objects.create(
            result=self.result,
            talent=self.student_talent,
            raw_score=78,
            percentage_score=78,
        )

    def test_zone_manager_can_promote_zone_results_to_country(self):
        request = self.factory.post(
            '/api/result-promotions/promote/',
            {
                'result_detail_ids': [self.result_detail.id],
                'competition_id': self.zone_competition.id,
                'country_competition_id': self.country_competition.id,
                'from_level': 'zone',
                'to_level': 'country',
            },
            format='json',
        )
        request.user = self.zone_manager

        response = ResultPromotionViewSet.as_view({'post': 'promote'})(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['promoted'], 1)
        self.assertTrue(
            CompetitionParticipation.objects.filter(
                competition=self.country_competition,
                student=self.student,
            ).exists(),
        )
