from django.test import TestCase

from students.models import Student
from competitions.models import Competition, CompetitionParticipation
from results.models import Result
from .models import (
	Country, Zone, Region, District, Ward, School, User, Talent, Club,
	StudentClubMembership, StudentTalent, EvaluationCriterion, TalentEvaluation,
	EvaluationScore,
)
from .serializers import (
	ClubSerializer, StudentClubMembershipSerializer, StudentTalentSerializer,
	EvaluationScoreSerializer,
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
		self.talent = Talent.objects.create(name='Evaluated Talent', category='other')
		self.student_talent = StudentTalent.objects.create(student=self.student, talent=self.talent)
		self.evaluator = User.objects.create_user(username='evaluator', password='test', role='sport_teacher', school=self.school)

	def test_school_allows_only_three_active_clubs_at_two_hundred_students(self):
		for index in range(3):
			Club.objects.create(name=f'Club {index}', school=self.school)

		serializer = ClubSerializer(data={'name': 'Club 4', 'school': self.school.id})

		self.assertFalse(serializer.is_valid())
		self.assertIn('non_field_errors', serializer.errors)

	def test_student_cannot_have_two_active_clubs(self):
		first_club = Club.objects.create(name='First Club', school=self.school)
		second_club = Club.objects.create(name='Second Club', school=self.school)
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
			talent = Talent.objects.create(name=f'Talent {index}', category='other')
			StudentTalent.objects.create(student=self.student, talent=talent)
		sixth_talent = Talent.objects.create(name='Talent 6', category='other')

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
