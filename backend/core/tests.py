from django.test import Client, TestCase

from students.models import Student, EducationLevel
from competitions.models import Competition, CompetitionParticipation
from results.models import Result
from .admin import UserChangeFormWithPassword
from .models import (
	Country, Zone, Region, District, Ward, School, SchoolOwnershipType, User,
	Talent, TalentCategory, CountryClub, SchoolClub, StudentClubMembership, StudentTalent, EvaluationCriterion,
	TalentEvaluation, EvaluationScore,
)
from .serializers import (
	SchoolClubSerializer, StudentClubMembershipSerializer, StudentTalentSerializer,
	EvaluationScoreSerializer, UserSerializer,
)


class FoundationRulesTests(TestCase):
	def setUp(self):
		country = Country.objects.create(name='Test Country', code='TST')
		zone = Zone.objects.create(country=country, name='Test Zone')
		region = Region.objects.create(zone=zone, name='Test Region')
		district = District.objects.create(region=region, name='Test District')
		ward = Ward.objects.create(district=district, name='Test Ward')
		self.school = School.objects.create(
			registry_number='TEST-001',
			name='Test School',
			ownership_type='Public',
			country=country,
			zone=zone,
			region=region,
			district=district,
			ward=ward,
			student_count=200,
		)
		self.student = Student.objects.create(
			first_name='Test',
			last_name='Student',
			gender='O',
			school=self.school,
		)
		category = TalentCategory.objects.create(name='Other')
		self.talent = Talent.objects.create(name='Evaluated Talent', category=category)
		self.student_talent = StudentTalent.objects.create(student=self.student, talent=self.talent)
		self.evaluator = User.objects.create_user(username='evaluator', password='test', role='sport_teacher', school=self.school)

	def test_new_school_is_unapproved_by_default(self):
		school = School.objects.create(
			registry_number='TEST-NEW-001',
			name='Pending School',
			ownership_type='government',
			country=self.school.country,
			zone=self.school.zone,
			region=self.school.region,
			district=self.school.district,
			ward=self.school.ward,
		)

		self.assertFalse(school.is_approved)
		self.assertFalse(School.objects.filter(is_approved=True, pk=school.pk).exists())

	def test_talent_admin_school_creation_is_auto_approved(self):
		admin_user = User.objects.create_user(
			username='talent-admin',
			password='test',
			role='talent_admin',
		)
		serializer = SchoolSerializer(
			data={
				'registry_number': 'TEST-ADMIN-001',
				'name': 'Approved by Talent Admin',
				'ownership_type': 'government',
				'country': self.school.country.id,
				'zone': self.school.zone.id,
				'region': self.school.region.id,
				'district': self.school.district.id,
				'ward': self.school.ward.id,
				'phone': '+255712345678',
				'physical_address': 'Approved address',
				'email': 'approved@example.com',
			},
			context={'request': type('RequestStub', (), {'user': admin_user})()},
		)

		self.assertTrue(serializer.is_valid(), serializer.errors)
		school = serializer.save()
		self.assertTrue(school.is_approved)

	def test_school_ownership_type_is_admin_managed(self):
		ownership = SchoolOwnershipType.objects.create(name='Roman Catholic')
		school = School.objects.create(
			registry_number='TEST-OWNERSHIP-001',
			name='Faith School',
			ownership_type='Roman Catholic',
			country=self.school.country,
			zone=self.school.zone,
			region=self.school.region,
			district=self.school.district,
			ward=self.school.ward,
		)

		self.assertEqual(school.ownership_type, 'Roman Catholic')
		self.assertIn(ownership, SchoolOwnershipType.objects.filter(is_active=True))

	def test_school_allows_only_three_active_clubs_at_two_hundred_students(self):
		for index in range(3):
			country_club = CountryClub.objects.create(name=f'Club {index}', country=self.school.country)
			SchoolClub.objects.create(country_club=country_club, school=self.school)

		country_club = CountryClub.objects.create(name='Club 4', country=self.school.country)
		serializer = SchoolClubSerializer(data={'country_club': country_club.id, 'school': self.school.id})

		self.assertFalse(serializer.is_valid())
		self.assertIn('non_field_errors', serializer.errors)

	def test_student_cannot_have_two_active_clubs(self):
		first_club_type = CountryClub.objects.create(name='First Club', country=self.school.country)
		second_club_type = CountryClub.objects.create(name='Second Club', country=self.school.country)
		first_club = SchoolClub.objects.create(country_club=first_club_type, school=self.school)
		second_club = SchoolClub.objects.create(country_club=second_club_type, school=self.school)
		StudentClubMembership.objects.create(student=self.student, club=first_club)

		serializer = StudentClubMembershipSerializer(data={
			'student': self.student.id,
			'club': second_club.id,
			'is_active': True,
		})

		self.assertFalse(serializer.is_valid())
		self.assertIn('non_field_errors', serializer.errors)

	def test_student_cannot_have_more_than_five_talents(self):
		for index in range(5):
			talent = Talent.objects.create(name=f'Talent {index}', category=self.talent.category)
			StudentTalent.objects.create(student=self.student, talent=talent)
		sixth_talent = Talent.objects.create(name='Talent 6', category=self.talent.category)

		serializer = StudentTalentSerializer(data={
			'student': self.student.id,
			'talent': sixth_talent.id,
			'proficiency_level': 1,
		})

		self.assertFalse(serializer.is_valid())
		self.assertIn('non_field_errors', serializer.errors)

	def test_evaluation_calculates_weighted_total_grade_and_pass_status(self):
		first = EvaluationCriterion.objects.create(talent=self.talent, name='Creativity', weight=50)
		second = EvaluationCriterion.objects.create(talent=self.talent, name='Presentation', weight=50)
		evaluation = TalentEvaluation.objects.create(student_talent=self.student_talent, evaluator=self.evaluator)

		EvaluationScore.objects.create(evaluation=evaluation, criterion=first, score=80)
		EvaluationScore.objects.create(evaluation=evaluation, criterion=second, score=60)
		evaluation.refresh_from_db()

		self.assertEqual(evaluation.total_score, 70)
		self.assertEqual(evaluation.grade, 'B+')
		self.assertTrue(evaluation.passed)

	def test_evaluation_below_fifty_fails(self):
		criterion = EvaluationCriterion.objects.create(talent=self.talent, name='Effort', weight=100)
		evaluation = TalentEvaluation.objects.create(student_talent=self.student_talent, evaluator=self.evaluator)
		EvaluationScore.objects.create(evaluation=evaluation, criterion=criterion, score=49)
		evaluation.refresh_from_db()

		self.assertFalse(evaluation.passed)
		self.assertEqual(evaluation.grade, 'C')

	def test_evaluation_score_rejects_invalid_score(self):
		criterion = EvaluationCriterion.objects.create(talent=self.talent, name='Quality', weight=100)
		evaluation = TalentEvaluation.objects.create(student_talent=self.student_talent, evaluator=self.evaluator)
		serializer = EvaluationScoreSerializer(data={
			'evaluation': evaluation.id,
			'criterion': criterion.id,
			'score': 101,
		})

		self.assertFalse(serializer.is_valid())
		self.assertIn('score', serializer.errors)

	def test_result_derives_grade_from_score(self):
		competition = Competition.objects.create(name='Test Competition', level='school')
		competition.schools.add(self.school)
		participation = CompetitionParticipation.objects.create(
			competition=competition,
			student=self.student,
			score=49,
			status='finished',
		)
		result = Result.objects.create(participation=participation, grade='A+', score=49)
		self.assertEqual(result.grade, 'C')
		self.assertEqual(result.score, 49)

		result.score = 75
		result.save()
		result.refresh_from_db()
		self.assertEqual(result.grade, 'A')

	def test_user_serializer_exposes_phone_number(self):
		user = User.objects.create_user(
			username='phone-user',
			password='secret123',
			role='sport_teacher',
			phone='+255712345678',
		)
		serialized = UserSerializer(user).data
		self.assertEqual(serialized['phone'], '+255712345678')

	def test_user_serializer_creates_linked_student_for_student_role(self):
		user = UserSerializer().create({
			'username': 'student-user',
			'first_name': 'Linked',
			'last_name': 'Student',
			'role': 'student',
			'school': self.school.id,
			'password': 'secret123',
		})

		self.assertIsNotNone(user.student)
		self.assertEqual(user.student.first_name, 'Linked')
		self.assertEqual(user.student.last_name, 'Student')
		self.assertEqual(user.student.school_id, self.school.id)
		self.assertEqual(user.student_id, user.student.id)

	def test_student_registration_reuses_unique_username_when_student_id_exists(self):
		country = Country.objects.create(name='Registration Country', code='REG')
		school = School.objects.create(
			registry_number='REG-001',
			name='Registration School',
			ownership_type='Government',
			is_approved=True,
			country=country,
			zone=self.school.zone,
			region=self.school.region,
			district=self.school.district,
			ward=self.school.ward,
		)
		teacher = User.objects.create_user(username='registration-teacher', password='secret123', role='sport_teacher', school=school)
		level = EducationLevel.objects.create(country=country, name='Form 1', code='F1', level_type='form', order=1, is_active=True)
		country_club = CountryClub.objects.create(name='Registration Club', country=country)
		club = SchoolClub.objects.create(school=school, country_club=country_club, is_active=True)
		Student.objects.create(first_name='Taken', last_name='Student', gender='M', school=school, student_id='REG-001/0001/2026')
		User.objects.create_user(username='REG-001/0002/2026', password='secret123', role='student', school=school)

		client = Client()
		client.force_login(teacher)
		response = client.post('/api/students/register/', {
			'first_name': 'New',
			'last_name': 'Student',
			'gender': 'M',
			'date_of_birth': '2012-01-15',
			'education_level_id': level.id,
			'password': 'StrongPass123',
			'club': club.id,
			'talents': [],
		}, content_type='application/json')

		self.assertEqual(response.status_code, 201, response.content.decode())
		student = Student.objects.get(first_name='New', last_name='Student')
		linked_user = User.objects.get(student=student)
		self.assertEqual(student.student_id, 'REG-001/0002/2026')
		self.assertEqual(linked_user.username, 'REG-001/0002/2026-1')


class UserScopeAdminTests(TestCase):
	def setUp(self):
		self.country = Country.objects.create(name='Tanzania', code='TZA')
		self.zone = Zone.objects.create(country=self.country, name='Lake Zone')
		self.region = Region.objects.create(zone=self.zone, name='Mwanza')
		self.district = District.objects.create(region=self.region, name='Mwanza District')
		self.ward = Ward.objects.create(district=self.district, name='Mwanza Ward')
		self.school = School.objects.create(
			registry_number='TZ-001',
			name='Test School',
			ownership_type='Public',
			country=self.country,
			zone=self.zone,
			region=self.region,
			district=self.district,
			ward=self.ward,
		)

	def test_region_manager_form_keeps_only_country_and_region(self):
		form = UserChangeFormWithPassword(data={
			'username': 'rmanager',
			'first_name': 'Region',
			'last_name': 'Manager',
			'email': 'region@example.com',
			'role': 'region_manager',
			'country': self.country.pk,
			'zone': self.zone.pk,
			'region': self.region.pk,
			'district': self.district.pk,
			'ward': self.ward.pk,
			'school': self.school.pk,
		})

		self.assertTrue(form.is_valid(), form.errors)
		self.assertEqual(form.cleaned_data['country'], self.country)
		self.assertEqual(form.cleaned_data['region'], self.region)
		self.assertIsNone(form.cleaned_data['zone'])
		self.assertIsNone(form.cleaned_data['district'])
		self.assertIsNone(form.cleaned_data['ward'])
		self.assertIsNone(form.cleaned_data['school'])

	def test_duplicate_zone_manager_assignment_is_rejected(self):
		User.objects.create_user(
			username='existing-zone-manager',
			password='secret123',
			role='zone_manager',
			country=self.country,
			zone=self.zone,
		)

		form = UserChangeFormWithPassword(data={
			'username': 'new-zone-manager',
			'first_name': 'New',
			'last_name': 'Zone',
			'email': 'zone@example.com',
			'role': 'zone_manager',
			'country': self.country.pk,
			'zone': self.zone.pk,
		})

		self.assertFalse(form.is_valid())
		self.assertIn('zone', form.errors)
		self.assertIn('already has a manager', str(form.errors['zone']))

	def test_new_user_form_defaults_to_tanzania_zones(self):
		kenya = Country.objects.create(name='Kenya', code='KEN')
		kenya_zone = Zone.objects.create(country=kenya, name='Nairobi Zone')
		form = UserChangeFormWithPassword()

		self.assertEqual(form.initial['country'], self.country.pk)
		self.assertIn(self.zone, form.fields['zone'].queryset)
		self.assertNotIn(kenya_zone, form.fields['zone'].queryset)

	def test_location_choices_follow_the_selected_hierarchy(self):
		other_zone = Zone.objects.create(country=self.country, name='Other Zone')
		other_region = Region.objects.create(zone=other_zone, name='Other Region')
		other_district = District.objects.create(region=other_region, name='Other District')
		other_ward = Ward.objects.create(district=other_district, name='Other Ward')
		other_school = School.objects.create(
			registry_number='TZ-002',
			name='Other School',
			ownership_type='Public',
			country=self.country,
			zone=other_zone,
			region=other_region,
			district=other_district,
			ward=other_ward,
		)
		form = UserChangeFormWithPassword(data={
			'role': 'sport_teacher',
			'country': self.country.pk,
			'zone': self.zone.pk,
			'region': self.region.pk,
			'district': self.district.pk,
			'ward': self.ward.pk,
			'school': self.school.pk,
		})

		self.assertIn(self.region, form.fields['region'].queryset)
		self.assertNotIn(other_region, form.fields['region'].queryset)
		self.assertIn(self.district, form.fields['district'].queryset)
		self.assertNotIn(other_district, form.fields['district'].queryset)
		self.assertIn(self.ward, form.fields['ward'].queryset)
		self.assertNotIn(other_ward, form.fields['ward'].queryset)
		self.assertIn(self.school, form.fields['school'].queryset)
		self.assertNotIn(other_school, form.fields['school'].queryset)
