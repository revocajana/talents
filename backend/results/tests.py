from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from competitions.models import Competition, CompetitionParticipation
from core.models import Country, District, Region, School, Talent, TalentCategory, User, Ward, Zone
from results.models import Result, ResultDetail, ResultPromotion, SchoolCompetitionSubmission
from results.views import ResultPromotionViewSet, SchoolCompetitionSubmissionViewSet
from students.models import Student


class ResultPromotionLockingTests(TestCase):
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
        self.student = Student.objects.create(first_name='Jane', last_name='Student', gender='F', school=self.school)
        self.talent_category = TalentCategory.objects.create(name='Sports')
        self.talent = Talent.objects.create(name='Swimming', category=self.talent_category)
        self.student_talent = self.student.talents.create(talent=self.talent, proficiency_level=3)
        self.zone_manager = User.objects.create_user(
            username='zone-manager-lock',
            password='secret123',
            role='zone_manager',
            country=self.country,
            zone=self.zone,
        )

    def test_promoted_result_detail_is_locked(self):
        zone_competition = Competition.objects.create(name='Zone Trials', level='zone', status='approved')
        zone_competition.content_type = ContentType.objects.get_for_model(Zone)
        zone_competition.object_id = self.zone.pk
        zone_competition.schools.add(self.school)
        zone_competition.save(update_fields=['content_type', 'object_id'])

        district_competition = Competition.objects.create(name='District Trials', level='district', status='approved')
        district_competition.content_type = ContentType.objects.get_for_model(District)
        district_competition.object_id = self.district.pk
        district_competition.schools.add(self.school)
        district_competition.save(update_fields=['content_type', 'object_id'])

        participation = CompetitionParticipation.objects.create(
            competition=district_competition,
            student=self.student,
            score=78,
            status='finished',
        )
        result = Result.objects.create(participation=participation, score=78, approval_status='pending')
        detail = ResultDetail.objects.create(result=result, talent=self.student_talent, raw_score=78, percentage_score=78)

        request = self.factory.post(
            '/api/result-promotions/promote/',
            {'competition_id': district_competition.id, 'zone_competition_id': zone_competition.id, 'from_level': 'district', 'to_level': 'zone'},
            format='json',
        )
        request.user = self.zone_manager

        response = ResultPromotionViewSet.as_view({'post': 'promote'})(request)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(ResultDetail.objects.get(pk=detail.pk).promoted_to == 'zone')
        with self.assertRaisesMessage(Exception, 'Promoted competition results are locked.'):
            detail.promoted_to = 'zone'
            detail.save()

    def test_reopening_school_submission_reverses_district_and_zone_promotions(self):
        district_manager = User.objects.create_user(
            username='district-manager-reopen',
            password='secret123',
            role='district_manager',
            country=self.country,
            zone=self.zone,
            region=self.region,
            district=self.district,
        )
        school_competition = Competition.objects.create(name='School Trials', level='school', status='approved')
        school_competition.schools.add(self.school)
        district_competition = Competition.objects.create(name='District Trials', level='district', status='approved')
        district_competition.content_type = ContentType.objects.get_for_model(District)
        district_competition.object_id = self.district.pk
        district_competition.schools.add(self.school)
        district_competition.save(update_fields=['content_type', 'object_id'])
        zone_competition = Competition.objects.create(name='Zone Trials', level='zone', status='approved')
        zone_competition.content_type = ContentType.objects.get_for_model(Zone)
        zone_competition.object_id = self.zone.pk
        zone_competition.schools.add(self.school)
        zone_competition.save(update_fields=['content_type', 'object_id'])
        submission = SchoolCompetitionSubmission.objects.create(school=self.school, competition=school_competition, status='draft')

        school_participation = CompetitionParticipation.objects.create(competition=school_competition, student=self.student, status='finished')
        school_result = Result.objects.create(participation=school_participation, approval_status='pending')
        school_detail = ResultDetail.objects.create(result=school_result, talent=self.student_talent, raw_score=80, percentage_score=80, promoted_to='district')
        district_participation = CompetitionParticipation.objects.create(competition=district_competition, student=self.student, status='finished')
        district_result = Result.objects.create(participation=district_participation, approval_status='pending')
        district_detail = ResultDetail.objects.create(result=district_result, talent=self.student_talent, raw_score=0, percentage_score=None)
        zone_participation = CompetitionParticipation.objects.create(competition=zone_competition, student=self.student, status='finished')
        zone_result = Result.objects.create(participation=zone_participation, approval_status='pending')
        ResultDetail.objects.create(result=zone_result, talent=self.student_talent, raw_score=0, percentage_score=None)
        district_promotion = ResultPromotion.objects.create(result=school_result, result_detail=school_detail, from_level='school', to_level='district', promoted_by=district_manager)
        ResultPromotion.objects.create(result=district_result, result_detail=district_detail, from_level='district', to_level='zone', promoted_by=district_manager)
        submission.status = 'submitted'
        submission.save(update_fields=['status'])

        request = self.factory.post('/api/school-result-submissions/reopen/', {}, format='json')
        request.user = district_manager
        response = SchoolCompetitionSubmissionViewSet.as_view({'post': 'reopen'})(request, pk=submission.pk)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'draft')
        self.assertEqual(response.data['demoted'], 1)
        school_detail.refresh_from_db()
        self.assertEqual(school_detail.promoted_to, '')
        self.assertFalse(ResultPromotion.objects.filter(pk=district_promotion.pk).exists())
        self.assertFalse(ResultDetail.objects.filter(pk=district_detail.pk).exists())
        self.assertFalse(CompetitionParticipation.objects.filter(pk=district_participation.pk).exists())
        self.assertFalse(CompetitionParticipation.objects.filter(pk=zone_participation.pk).exists())


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

    def test_zone_manager_can_promote_district_results_to_zone(self):
        district_competition = Competition.objects.create(
            name='District Trials',
            level='district',
            status='approved',
        )
        district_competition.content_type = ContentType.objects.get_for_model(District)
        district_competition.object_id = self.district.pk
        district_competition.schools.add(self.school)
        district_competition.save(update_fields=['content_type', 'object_id'])

        district_participation = CompetitionParticipation.objects.create(
            competition=district_competition,
            student=self.student,
            score=78,
            status='finished',
        )
        district_result = Result.objects.create(participation=district_participation, score=78, approval_status='pending')
        district_result_detail = ResultDetail.objects.create(
            result=district_result,
            talent=self.student_talent,
            raw_score=78,
            percentage_score=78,
        )

        request = self.factory.post(
            '/api/result-promotions/promote/',
            {
                'result_detail_ids': [district_result_detail.id],
                'competition_id': district_competition.id,
                'zone_competition_id': self.zone_competition.id,
                'from_level': 'district',
                'to_level': 'zone',
            },
            format='json',
        )
        request.user = self.zone_manager

        response = ResultPromotionViewSet.as_view({'post': 'promote'})(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['promoted'], 1)
        self.assertTrue(
            CompetitionParticipation.objects.filter(
                competition=self.zone_competition,
                student=self.student,
            ).exists(),
        )

    def test_district_manager_can_submit_district_results_to_zone(self):
        district_manager = User.objects.create_user(
            username='district-manager',
            password='secret123',
            role='district_manager',
            district=self.district,
            zone=self.zone,
            region=self.region,
            country=self.country,
        )
        district_competition = Competition.objects.create(
            name='District Trials',
            level='district',
            status='approved',
        )
        district_competition.content_type = ContentType.objects.get_for_model(District)
        district_competition.object_id = self.district.pk
        district_competition.schools.add(self.school)
        district_competition.save(update_fields=['content_type', 'object_id'])

        district_participation = CompetitionParticipation.objects.create(
            competition=district_competition,
            student=self.student,
            score=78,
            status='finished',
        )
        district_result = Result.objects.create(participation=district_participation, score=78, approval_status='pending')
        district_result_detail = ResultDetail.objects.create(
            result=district_result,
            talent=self.student_talent,
            raw_score=78,
            percentage_score=78,
        )

        request = self.factory.post(
            '/api/result-promotions/promote/',
            {
                'competition_id': district_competition.id,
                'zone_competition_id': self.zone_competition.id,
                'from_level': 'district',
                'to_level': 'zone',
            },
            format='json',
        )
        request.user = district_manager

        response = ResultPromotionViewSet.as_view({'post': 'promote'})(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['promoted'], 1)
        self.assertTrue(
            CompetitionParticipation.objects.filter(
                competition=self.zone_competition,
                student=self.student,
            ).exists(),
        )

    def test_district_manager_can_demote_district_result(self):
        district_manager = User.objects.create_user(
            username='district-manager-demote',
            password='secret123',
            role='district_manager',
            district=self.district,
            zone=self.zone,
            region=self.region,
            country=self.country,
        )
        school_competition = Competition.objects.create(
            name='School Trials',
            level='school',
            status='approved',
        )
        school_competition.content_type = ContentType.objects.get_for_model(School)
        school_competition.object_id = self.school.pk
        school_competition.schools.add(self.school)
        school_competition.save(update_fields=['content_type', 'object_id'])
        school_participation = CompetitionParticipation.objects.create(
            competition=school_competition,
            student=self.student,
            score=78,
            status='finished',
        )
        school_result = Result.objects.create(participation=school_participation, score=78)
        source_detail = ResultDetail.objects.create(
            result=school_result,
            talent=self.student_talent,
            raw_score=78,
            percentage_score=78,
            promoted_to='district',
        )

        district_competition = Competition.objects.create(
            name='District Trials',
            level='district',
            status='approved',
        )
        district_competition.content_type = ContentType.objects.get_for_model(District)
        district_competition.object_id = self.district.pk
        district_competition.schools.add(self.school)
        district_competition.save(update_fields=['content_type', 'object_id'])
        district_participation = CompetitionParticipation.objects.create(
            competition=district_competition,
            student=self.student,
            score=78,
            status='finished',
        )
        district_result = Result.objects.create(participation=district_participation, score=78)
        target_detail = ResultDetail.objects.create(
            result=district_result,
            talent=self.student_talent,
            raw_score=78,
            percentage_score=78,
        )
        promotion = ResultPromotion.objects.create(
            result=school_result,
            result_detail=source_detail,
            from_level='school',
            to_level='district',
            promoted_by=district_manager,
        )

        request = self.factory.post(
            '/api/result-promotions/demote/',
            {'result_detail_ids': [target_detail.id]},
            format='json',
        )
        request.user = district_manager

        response = ResultPromotionViewSet.as_view({'post': 'demote'})(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['demoted'], 1)
        self.assertEqual(response.data['result_detail_ids'], [target_detail.id])
        source_detail.refresh_from_db()
        self.assertEqual(source_detail.promoted_to, '')
        self.assertTrue(ResultDetail.objects.filter(pk=source_detail.pk).exists())
        self.assertFalse(ResultDetail.objects.filter(pk=target_detail.pk).exists())
        self.assertFalse(Result.objects.filter(pk=district_result.pk).exists())
        self.assertFalse(CompetitionParticipation.objects.filter(pk=district_participation.pk).exists())
        self.assertFalse(ResultPromotion.objects.filter(pk=promotion.pk).exists())

    def test_district_manager_can_submit_district_results_to_zone_without_existing_zone_competition(self):
        district_manager = User.objects.create_user(
            username='district-manager-no-zone',
            password='secret123',
            role='district_manager',
            district=self.district,
            zone=self.zone,
            region=self.region,
            country=self.country,
        )
        district_competition = Competition.objects.create(
            name='District Trials',
            level='district',
            status='approved',
        )
        district_competition.content_type = ContentType.objects.get_for_model(District)
        district_competition.object_id = self.district.pk
        district_competition.schools.add(self.school)
        district_competition.save(update_fields=['content_type', 'object_id'])

        district_participation = CompetitionParticipation.objects.create(
            competition=district_competition,
            student=self.student,
            score=78,
            status='finished',
        )
        district_result = Result.objects.create(participation=district_participation, score=78, approval_status='pending')
        district_result_detail = ResultDetail.objects.create(
            result=district_result,
            talent=self.student_talent,
            raw_score=78,
            percentage_score=78,
        )

        request = self.factory.post(
            '/api/result-promotions/promote/',
            {
                'competition_id': district_competition.id,
                'from_level': 'district',
                'to_level': 'zone',
            },
            format='json',
        )
        request.user = district_manager

        response = ResultPromotionViewSet.as_view({'post': 'promote'})(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['promoted'], 1)
        self.assertTrue(
            Competition.objects.filter(level='zone', content_type=ContentType.objects.get_for_model(Zone), object_id=self.zone.pk).exists(),
        )

    def test_district_manager_can_submit_school_submission_for_owned_school(self):
        district_manager = User.objects.create_user(
            username='district-manager',
            password='secret123',
            role='district_manager',
            district=self.district,
        )
        school_competition = Competition.objects.create(
            name='School Trials',
            level='school',
            status='approved',
        )
        school_competition.content_type = ContentType.objects.get_for_model(School)
        school_competition.object_id = self.school.pk
        school_competition.schools.add(self.school)
        school_competition.save(update_fields=['content_type', 'object_id'])

        create_request = self.factory.post(
            '/api/school-result-submissions/',
            {'school': self.school.id, 'competition': school_competition.id, 'status': 'draft'},
            format='json',
        )
        create_request.user = district_manager

        create_response = SchoolCompetitionSubmissionViewSet.as_view({'post': 'create'})(create_request)
        self.assertEqual(create_response.status_code, 201)

        submission = create_response.data
        submit_request = self.factory.post(f'/api/school-result-submissions/{submission["id"]}/submit/')
        submit_request.user = district_manager

        submit_response = SchoolCompetitionSubmissionViewSet.as_view({'post': 'submit'})(submit_request, pk=submission['id'])
        self.assertEqual(submit_response.status_code, 200)
        self.assertEqual(submit_response.data['status'], 'submitted')

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
