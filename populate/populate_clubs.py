import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
if PROJECT_ROOT not in sys.path:
	sys.path.append(PROJECT_ROOT)
if BACKEND_DIR not in sys.path:
	sys.path.append(BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')

import django

django.setup()

from django.db import transaction

from core.models import ( # type: ignore
	Club,
	ClubTalent,
	ClubTeacher,
	EvaluationCriterion,
	School,
	StudentClubMembership,
	Talent,
)
from students.models import Student # type: ignore


TALENTS = {
	'Music': ['Classical Music', 'Contemporary Music', 'Choir Singing', 'Composition'],
	'Dance': ['Ballet', 'Hip-Hop Dance', 'Contemporary Dance', 'Traditional Cultural Dance'],
	'Theater/Drama': ['Acting', 'Dramatic Monologue', 'Improvisation', 'Stage Design'],
	'Visual Arts': ['Painting', 'Sculpting', 'Photography', 'Graphic Design'],
	'Literary Arts': ['Poetry', 'Story Writing', 'Public Speaking', 'Debate'],
	'Sports Talent': ['Basketball', 'Soccer', 'Swimming', 'Track and Field', 'Gymnastics'],
	'Culinary Arts': ['Cooking', 'Baking', 'Food Photography'],
	'Technology': ['Robotics', 'Game Development', 'Web Development', '3D Printing'],
}

CLUBS = [
	('Rumanyika Club', 'Singing, instrumental music, band, choir', 'Music'),
	('Ibanda Club', 'Ballet, hip-hop, contemporary, traditional dance', 'Dance'),
	('Serengeti Club', 'Acting, directing, playwriting, stagecraft', 'Theater/Drama'),
	('Burigi Club', 'Football, basketball, track and field, gymnastics', 'Sports Talent'),
	('Mikumi Club', 'Drawing, painting, digital art, sculpture', 'Visual Arts'),
	('Mtagata Club', 'Cooking, baking, food decoration', 'Culinary Arts'),
	('Ngorongoro Club', 'Writing, public speaking, debate', 'Literary Arts'),
	('Saanane Club', 'Robotics, coding, environmental science, innovation', 'Technology'),
	('Rubondo Club', 'Photography, videography, media production', 'Visual Arts'),
	('Gombe Club', 'Community service, charity, and volunteering', 'Literary Arts'),
]

CATEGORY_CODES = {
	'Music': 'music',
	'Dance': 'arts',
	'Theater/Drama': 'arts',
	'Visual Arts': 'arts',
	'Literary Arts': 'academics',
	'Sports Talent': 'sports',
	'Culinary Arts': 'arts',
	'Technology': 'technology',
}


def populate_talents():
	talents = {}
	created = 0
	for category, names in TALENTS.items():
		category_key = CATEGORY_CODES[category]
		for name in names:
			talent, was_created = Talent.objects.get_or_create(
				name=name,
				defaults={'category': category_key, 'description': f'{category} talent'},
			)
			talents[name] = talent
			created += int(was_created)

			criteria = [
				('Creativity', 'Originality and creative expression', 30),
				('Technical Skill', 'Control and technical ability', 30),
				('Presentation', 'Clarity, confidence, and presentation', 25),
				('Effort', 'Preparation and commitment', 15),
			]
			for criterion_name, description, weight in criteria:
				EvaluationCriterion.objects.get_or_create(
					talent=talent,
					name=criterion_name,
					defaults={'description': description, 'weight': weight},
				)
	return talents, created


@transaction.atomic
def populate_clubs():
	talents, talents_created = populate_talents()
	schools = School.objects.all().order_by('id')
	clubs_created = 0
	assignments_created = 0
	memberships_created = 0

	for school in schools:
		actual_student_count = school.students.count()
		if school.student_count != actual_student_count:
			school.student_count = actual_student_count
			school.save(update_fields=['student_count'])

		club_limit = school.recommended_club_count
		school_clubs = []
		for name, focus, category in CLUBS[:club_limit]:
			club, was_created = Club.objects.get_or_create(
				school=school,
				name=name,
				defaults={'focus': focus},
			)
			school_clubs.append(club)
			clubs_created += int(was_created)

			category_talents = [talent for talent in talents.values() if talent.category == CATEGORY_CODES[category]]
			for talent in category_talents:
				_, created = ClubTalent.objects.get_or_create(club=club, talent=talent)
				assignments_created += int(created)

		teachers = school.users.filter(role='sport_teacher').order_by('id')
		for index, teacher in enumerate(teachers):
			club = school_clubs[index % len(school_clubs)] if school_clubs else None
			if club:
				_, created = ClubTeacher.objects.get_or_create(club=club, teacher=teacher)
				assignments_created += int(created)

		for index, student in enumerate(Student.objects.filter(school=school).order_by('id')):
			if not school_clubs or StudentClubMembership.objects.filter(student=student, is_active=True).exists():
				continue
			StudentClubMembership.objects.create(student=student, club=school_clubs[index % len(school_clubs)])
			memberships_created += 1

	print('--- Club and related data populated ---')
	print(f'Talents created: {talents_created}')
	print(f'Schools processed: {schools.count()}')
	print(f'Clubs created: {clubs_created}')
	print(f'Club assignments created: {assignments_created}')
	print(f'Student memberships created: {memberships_created}')


if __name__ == '__main__':
	populate_clubs()
