import os
import sys
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / 'backend'
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from django.contrib.auth.hashers import make_password
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone

from competitions.models import Competition, CompetitionJudge, CompetitionParticipation
from core.models import ( # type: ignore
    Announcement,
    AuditLog,
    Club,
    ClubTalent,
    ClubTeacher,
    Country,
    District,
    EvaluationCriterion,
    EvaluationScore,
    Message,
    Notification,
    Parent,
    Region,
    School,
    SchoolOwnershipType,
    StudentClubMembership,
    StudentTalent,
    Talent,
    TalentEvaluation,
    User,
    Ward,
    Zone,
)
from results.models import Result, ResultDetail
from students.models import Student


PREFIX = 'Sample'
PASSWORD = 'SamplePass123!'


def user(username, role, **fields):
    account, _ = User.objects.get_or_create(username=username)
    account.role = role
    account.set_password(PASSWORD)
    for field, value in fields.items():
        setattr(account, field, value)
    account.save()
    return account


def create_geography():
    country, _ = Country.objects.get_or_create(code='SMP', defaults={'name': 'Sample Country'})
    zone, _ = Zone.objects.get_or_create(country=country, name='Sample Zone')
    region, _ = Region.objects.get_or_create(zone=zone, name='Sample Region')
    district, _ = District.objects.get_or_create(region=region, name='Sample District')
    ward, _ = Ward.objects.get_or_create(district=district, name='Sample Ward')
    ownership, _ = SchoolOwnershipType.objects.get_or_create(name='Government')
    return country, zone, region, district, ward, ownership


def create_schools(country, zone, region, district, ward):
    schools = []
    for number in (1, 2):
        school, _ = School.objects.update_or_create(
            registry_number=f'SMP-SCH-{number:02d}',
            defaults={
                'name': f'Sample Secondary School {number}',
                'ownership_type': 'Government',
                'country': country,
                'zone': zone,
                'region': region,
                'district': district,
                'ward': ward,
                'phone': f'+25570000000{number}',
                'email': f'school{number}@sample.test',
                'is_approved': True,
            },
        )
        schools.append(school)
    return schools


def create_talents():
    definitions = {
        'Football': 'sports',
        'Choir': 'music',
        'Robotics': 'technology',
        'Poetry': 'academics',
    }
    talents = {}
    for name, category in definitions.items():
        talent, _ = Talent.objects.update_or_create(
            name=f'{PREFIX} {name}',
            defaults={'category': category, 'description': f'Sample {name} talent.'},
        )
        talents[name] = talent
        for criterion_name, weight in (
            ('Creativity', Decimal('40')),
            ('Technical Skill', Decimal('35')),
            ('Presentation', Decimal('25')),
        ):
            EvaluationCriterion.objects.update_or_create(
                talent=talent,
                name=criterion_name,
                defaults={'description': f'{criterion_name} score', 'weight': weight, 'is_active': True},
            )
    return talents


def create_people(schools, country, zone, region, district, ward):
    parent_user = user(
        'sample-parent',
        'parent',
        first_name='Sample',
        last_name='Parent',
        email='parent@sample.test',
        country=country,
    )
    Parent.objects.update_or_create(
        username='sample-parent',
        defaults={
            'password': make_password(PASSWORD),
            'full_name': 'Sample Parent',
            'phone': '+255700000010',
            'email': 'parent@sample.test',
            'user': parent_user,
        },
    )

    admin = user('sample-admin', 'talent_admin', first_name='Sample', last_name='Admin', country=country)
    manager = user(
        'sample-district-manager',
        'district_manager',
        first_name='Sample',
        last_name='Manager',
        country=country,
        zone=zone,
        region=region,
        district=district,
        ward=ward,
    )
    teachers = []
    students = []
    for school_number, school in enumerate(schools, start=1):
        teacher = user(
            f'sample-teacher-{school_number}',
            'sport_teacher',
            first_name='Sample',
            last_name=f'Teacher {school_number}',
            school=school,
            country=country,
            district=district,
        )
        teachers.append(teacher)
        for student_number in range(1, 4):
            student, _ = Student.objects.update_or_create(
                student_id=f'SMP-STU-{school_number}-{student_number}',
                defaults={
                    'first_name': f'Student {student_number}',
                    'last_name': f'School {school_number}',
                    'gender': 'F' if student_number == 2 else 'M',
                    'date_of_birth': date(2010, 1, 1) + timedelta(days=student_number),
                    'school': school,
                    'parent': Parent.objects.get(username='sample-parent'),
                },
            )
            students.append(student)
            user(
                f'sample-student-{school_number}-{student_number}',
                'student',
                first_name=student.first_name,
                last_name=student.last_name,
                school=school,
                student=student,
                country=country,
            )
    return admin, manager, teachers, students, parent_user


def create_clubs(schools, teachers, students, talents):
    clubs = []
    for school, teacher in zip(schools, teachers):
        club, _ = Club.objects.update_or_create(
            school=school,
            name=f'{PREFIX} Innovation Club',
            defaults={'focus': 'Technology and creative problem solving', 'description': 'Sample school club'},
        )
        ClubTeacher.objects.get_or_create(club=club, teacher=teacher)
        ClubTalent.objects.get_or_create(club=club, talent=talents['Robotics'])
        clubs.append(club)
        school_students = [student for student in students if student.school_id == school.id]
        for student in school_students:
            StudentClubMembership.objects.update_or_create(
                student=student,
                club=club,
                defaults={'is_active': True, 'left_at': None},
            )
        school.student_count = len(school_students)
        school.save(update_fields=['student_count'])
    return clubs


def create_competition(school, students, talent, organizer, judge):
    competition, _ = Competition.objects.update_or_create(
        name=f'{PREFIX} Talent Challenge',
        defaults={
            'description': 'Sample competition for frontend testing.',
            'level': 'school',
            'start_date': date.today() - timedelta(days=7),
            'end_date': date.today(),
            'status': 'completed',
            'organizer': organizer,
        },
    )
    competition.schools.set([school])
    competition.content_type = ContentType.objects.get_for_model(School)
    competition.object_id = school.id
    competition.save(update_fields=['content_type', 'object_id'])
    CompetitionJudge.objects.get_or_create(competition=competition, judge=judge)

    for rank, student in enumerate(students[:3], start=1):
        score = Decimal(92 - rank * 5)
        participation, _ = CompetitionParticipation.objects.update_or_create(
            competition=competition,
            student=student,
            defaults={'score': score, 'status': 'finished'},
        )
        result, _ = Result.objects.get_or_create(participation=participation)
        result.score = score
        result.award = ('gold', 'silver', 'bronze')[rank - 1]
        result.rank = rank
        result.venue = 'Sample School Hall'
        result.competition_date = competition.start_date
        result.approval_status = 'approved'
        result.approved_by = organizer
        result.approved_at = timezone.now()
        result.save()
        student_talent, _ = StudentTalent.objects.get_or_create(
            student=student,
            talent=talent,
            defaults={'proficiency_level': 3, 'notes': 'Sample competition talent'},
        )
        ResultDetail.objects.update_or_create(
            result=result,
            talent=student_talent,
            defaults={'raw_score': score, 'percentage_score': score, 'notes': 'Sample result detail'},
        )
    return competition


@transaction.atomic
def populate():
    country, zone, region, district, ward, _ = create_geography()
    schools = create_schools(country, zone, region, district, ward)
    talents = create_talents()
    admin, manager, teachers, students, parent_user = create_people(
        schools, country, zone, region, district, ward
    )
    clubs = create_clubs(schools, teachers, students, talents)
    competition = create_competition(schools[0], students[:3], talents['Football'], manager, teachers[0])

    evaluation_talent, _ = StudentTalent.objects.get_or_create(
        student=students[0],
        talent=talents['Football'],
        defaults={'proficiency_level': 4, 'notes': 'Sample advanced football talent'},
    )
    evaluation, _ = TalentEvaluation.objects.get_or_create(
        student_talent=evaluation_talent,
        evaluator=teachers[0],
        defaults={'feedback': 'Strong sample performance.'},
    )
    for criterion in talents['Football'].evaluation_criteria.all():
        EvaluationScore.objects.update_or_create(
            evaluation=evaluation,
            criterion=criterion,
            defaults={'score': Decimal('85'), 'comment': 'Sample score'},
        )

    Announcement.objects.update_or_create(
        title=f'{PREFIX} Competition Results',
        defaults={
            'content': 'Sample competition results are available.',
            'scope': 'national',
            'country': country,
            'is_active': True,
            'published_at': timezone.now(),
        },
    )
    student_user = User.objects.get(username='sample-student-1-1')
    Message.objects.update_or_create(
        sender=teachers[0],
        recipient=student_user,
        subject=f'{PREFIX} Welcome',
        defaults={'body': 'Welcome to the sample account.'},
    )
    Notification.objects.update_or_create(
        recipient=student_user,
        title=f'{PREFIX} New Result',
        defaults={'body': 'Your sample competition result is available.', 'link': '/dashboard/student'},
    )
    AuditLog.objects.update_or_create(
        actor=admin,
        action='sample_data_seeded',
        model_name='SampleDataset',
        object_id='sample',
        defaults={'changes': {'schools': len(schools), 'students': len(students), 'clubs': len(clubs)}},
    )

    print('Sample data is ready.')
    print('Login password for generated users:', PASSWORD)
    print('Users: sample-admin, sample-district-manager, sample-teacher-1, sample-student-1-1, sample-parent')
    print('Competition:', competition.name)


if __name__ == '__main__':
    populate()