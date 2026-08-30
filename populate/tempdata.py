import os
import sys
from datetime import date, timedelta
from decimal import Decimal

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')

# pyrefly: ignore [missing-import]
import django

django.setup()

# pyrefly: ignore [missing-import]
from django.contrib.auth.hashers import make_password
# pyrefly: ignore [missing-import]
from django.db import transaction
# pyrefly: ignore [missing-import]
from django.utils import timezone

from competitions.models import Competition, CompetitionParticipation # type: ignore
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
    StudentClubMembership,
    StudentTalent,
    SubmissionFeedback,
    Talent,
    TalentEvaluation,
    TalentSubmission,
    User,
    Ward,
    Zone,
)
from results.models import Result # type: ignore
from students.models import Student # type: ignore


DEMO_PREFIX = 'DEMO-'
CLUBS = [
    ('Rumanyika Club', 'Music and performance'),
    ('Ibanda Club', 'Dance and theater'),
    ('Burigi Club', 'Sports and fitness'),
]
TALENTS = [
    ('Choir Singing', 'music'),
    ('Contemporary Music', 'music'),
    ('Hip-Hop Dance', 'arts'),
    ('Acting', 'arts'),
    ('Football', 'sports'),
    ('Basketball', 'sports'),
    ('Robotics', 'technology'),
    ('Poetry', 'academics'),
]
CRITERIA = [
    ('Creativity', 'Originality and creative expression', 30),
    ('Technical Skill', 'Control and technical ability', 30),
    ('Presentation', 'Clarity, confidence, and presentation', 25),
    ('Effort', 'Preparation and commitment', 15),
]


def get_or_create_user(username, role, **fields):
    password = fields.pop('password', 'DemoPass123!')
    student = fields.get('student')
    if student is not None:
        existing_user = User.objects.filter(student=student).first()
        if existing_user is not None and existing_user.username != username:
            user = existing_user
            user.username = username
        else:
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={'role': role, 'password': make_password(password), **fields},
            )
    else:
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={'role': role, 'password': make_password(password), **fields},
        )

    changed = False
    if user.role != role:
        user.role = role
        changed = True
    for field, value in fields.items():
        if value is not None and getattr(user, field) != value:
            setattr(user, field, value)
            changed = True
    if not user.has_usable_password() or not user.check_password(password):
        user.password = make_password(password)
        changed = True
    if changed:
        user.save()
    return user


def clear_demo_data():
    """Delete previously seeded demo records so the script can run repeatedly."""
    demo_user_ids = list(User.objects.filter(username__startswith='demo-').values_list('id', flat=True))
    demo_student_ids = list(Student.objects.filter(student_id__startswith='DEMO-').values_list('id', flat=True))

    if demo_user_ids:
        Message.objects.filter(sender_id__in=demo_user_ids).delete()
        TalentEvaluation.objects.filter(evaluator_id__in=demo_user_ids).delete()
        SubmissionFeedback.objects.filter(author_id__in=demo_user_ids).delete()
        Notification.objects.filter(recipient_id__in=demo_user_ids).delete()
        AuditLog.objects.filter(actor_id__in=demo_user_ids).delete()

    if demo_student_ids:
        StudentTalent.objects.filter(student_id__in=demo_student_ids).delete()
        StudentClubMembership.objects.filter(student_id__in=demo_student_ids).delete()
        TalentSubmission.objects.filter(student_id__in=demo_student_ids).delete()
        CompetitionParticipation.objects.filter(student_id__in=demo_student_ids).delete()

    User.objects.filter(username__startswith='demo-').delete()
    Parent.objects.filter(username__startswith='demo-').delete()

    School.objects.filter(registry_number__startswith='DEMO-').delete()
    Ward.objects.filter(name__startswith='DEMO-').delete()
    District.objects.filter(name__startswith='DEMO-').delete()
    Region.objects.filter(name__startswith='DEMO-').delete()
    Zone.objects.filter(name__startswith='DEMO-').delete()
    Country.objects.filter(code='DMO').delete()
    Talent.objects.filter(name__startswith='DEMO-').delete()
    Competition.objects.filter(name__startswith='DEMO-').delete()
    Announcement.objects.filter(title__startswith='DEMO-').delete()
    Message.objects.filter(subject__startswith='DEMO-').delete()
    Notification.objects.filter(title__startswith='DEMO-').delete()


def create_geography():
    country, _ = Country.objects.get_or_create(
        code='DMO',
        defaults={'name': f'{DEMO_PREFIX} Country'},
    )
    zone, _ = Zone.objects.get_or_create(
        country=country,
        name=f'{DEMO_PREFIX} Zone',
    )
    region, _ = Region.objects.get_or_create(
        zone=zone,
        name=f'{DEMO_PREFIX} Region',
    )
    districts = []
    schools = []
    for district_number in range(1, 3):
        district, _ = District.objects.get_or_create(
            region=region,
            name=f'{DEMO_PREFIX} District {district_number}',
        )
        districts.append(district)
        for school_number in range(1, 3):
            ward, _ = Ward.objects.get_or_create(
                district=district,
                name=f'{DEMO_PREFIX} Ward {district_number}-{school_number}',
            )
            school, _ = School.objects.get_or_create(
                registry_number=f'{DEMO_PREFIX}SCH-{district_number}-{school_number}',
                defaults={
                    'name': f'{DEMO_PREFIX} School {district_number}-{school_number}',
                    'ownership_type': 'Government',
                    'country': country,
                    'zone': zone,
                    'region': region,
                    'district': district,
                    'ward': ward,
                    'phone': '+255700000000',
                    'email': f'demo-school-{district_number}-{school_number}@example.test',
                },
            )
            schools.append(school)
    return country, zone, region, districts, schools


def create_talents():
    talent_map = {}
    for name, category in TALENTS:
        talent, _ = Talent.objects.get_or_create(
            name=f'{DEMO_PREFIX}{name}',
            defaults={'category': category, 'description': f'Temporary demo {name} talent'},
        )
        talent_map[name] = talent
        for criterion_name, description, weight in CRITERIA:
            EvaluationCriterion.objects.get_or_create(
                talent=talent,
                name=criterion_name,
                defaults={'description': description, 'weight': weight},
            )
    return talent_map


def create_students_and_users(schools, districts):
    students = []
    student_users = []
    teachers = []
    parent, _ = Parent.objects.get_or_create(
        username=f'{DEMO_PREFIX.lower()}parent',
        defaults={
            'password': make_password('DemoPass123!'),
            'full_name': 'Demo Parent',
            'phone': '+255700000001',
            'email': 'demo-parent@example.test',
        },
    )
    parent_user = get_or_create_user(
        f'{DEMO_PREFIX.lower()}parent',
        'parent',
        first_name='Demo',
        last_name='Parent',
        email='demo-parent@example.test',
    )
    if parent.user_id != parent_user.id:
        parent.user = parent_user
        parent.save(update_fields=['user'])

    for school_index, school in enumerate(schools, start=1):
        teacher = get_or_create_user(
            f'{DEMO_PREFIX.lower()}teacher{school_index}',
            'sport_teacher',
            first_name='Demo',
            last_name=f'Teacher {school_index}',
            school=school,
        )
        teachers.append(teacher)
        for student_index in range(1, 7):
            student, _ = Student.objects.get_or_create(
                student_id=f'{DEMO_PREFIX}STU-{school_index}-{student_index}',
                defaults={
                    'first_name': f'Demo{school_index}',
                    'last_name': f'Student{student_index}',
                    'gender': 'M' if student_index % 2 else 'F',
                    'date_of_birth': date(2010, 1, 1) + timedelta(days=student_index),
                    'school': school,
                    'parent': parent,
                },
            )
            students.append(student)
            if student.parent_id != parent.id:
                student.parent = parent
                student.save(update_fields=['parent'])
            student_user = get_or_create_user(
                f'{DEMO_PREFIX.lower()}student{school_index}_{student_index}',
                'student',
                first_name=student.first_name,
                last_name=student.last_name,
                school=school,
                student=student,
            )
            student_users.append(student_user)

    district_manager = get_or_create_user(
        f'{DEMO_PREFIX.lower()}districtmanager',
        'district_manager',
        first_name='Demo',
        last_name='District Manager',
        district=districts[0],
    )
    talent_admin = get_or_create_user(
        f'{DEMO_PREFIX.lower()}admin',
        'talent_admin',
        first_name='Demo',
        last_name='Talent Admin',
    )
    return students, student_users, teachers, parent_user, district_manager, talent_admin


def create_clubs(schools, students, teachers, talent_map):
    clubs = []
    for school_index, school in enumerate(schools):
        school_students = [student for student in students if student.school_id == school.id]
        school.student_count = len(school_students)
        school.save(update_fields=['student_count'])
        school_clubs = []
        for club_name, focus in CLUBS:
            club, _ = Club.objects.get_or_create(
                school=school,
                name=f'{DEMO_PREFIX}{club_name}',
                defaults={'focus': focus, 'description': f'Temporary demo club for {school.name}'},
            )
            school_clubs.append(club)
            if club_name == 'Rumanyika Club':
                club_talents = ['Choir Singing', 'Contemporary Music']
            elif club_name == 'Ibanda Club':
                club_talents = ['Hip-Hop Dance', 'Acting']
            else:
                club_talents = ['Football', 'Basketball']
            for talent_name in club_talents:
                ClubTalent.objects.get_or_create(club=club, talent=talent_map[talent_name])
            ClubTeacher.objects.get_or_create(club=club, teacher=teachers[school_index])
        clubs.extend(school_clubs)
        for student_index, student in enumerate(school_students):
            club = school_clubs[student_index % len(school_clubs)]
            StudentClubMembership.objects.get_or_create(student=student, club=club, defaults={'is_active': True})
    return clubs


def create_competitions_and_results(schools, students, talent_map, evaluator):
    competition, _ = Competition.objects.get_or_create(
        name=f'{DEMO_PREFIX} School Talent Challenge',
        defaults={
            'description': 'Temporary competition for frontend testing',
            'level': 'school',
            'start_date': date.today() - timedelta(days=14),
            'end_date': date.today() - timedelta(days=7),
        },
    )
    competition.schools.set(schools)
    selected_students = students[:8]
    competition.participants.set(selected_students)
    for index, student in enumerate(selected_students):
        participation, _ = CompetitionParticipation.objects.get_or_create(
            competition=competition,
            student=student,
            defaults={'score': Decimal(70 + index), 'status': 'finished'},
        )
        Result.objects.get_or_create(
            participation=participation,
            defaults={
                'grade': 'B+',
                'grade_points': Decimal('3.30'),
                'award': 'gold' if index == 0 else 'none',
                'rank': index + 1,
                'venue': f'{DEMO_PREFIX} Main Hall',
                'competition_date': competition.start_date,
            },
        )

    demo_student_talent, _ = StudentTalent.objects.get_or_create(
        student=students[0],
        talent=talent_map['Football'],
        defaults={'proficiency_level': 3, 'notes': 'Temporary demo talent'},
    )
    evaluation, _ = TalentEvaluation.objects.get_or_create(
        student_talent=demo_student_talent,
        evaluator=evaluator,
        defaults={'feedback': 'Good temporary demo performance.'},
    )
    for criterion in EvaluationCriterion.objects.filter(talent=talent_map['Football']):
        EvaluationScore.objects.get_or_create(
            evaluation=evaluation,
            criterion=criterion,
            defaults={'score': Decimal('75')},
        )

    for student in students[1:4]:
        StudentTalent.objects.get_or_create(
            student=student,
            talent=talent_map['Football'],
            defaults={'proficiency_level': 2},
        )
    return competition


@transaction.atomic
def populate():
    clear_demo_data()
    country, zone, region, districts, schools = create_geography()
    talent_map = create_talents()
    students, student_users, teachers, parent_user, district_manager, talent_admin = create_students_and_users(schools, districts)
    clubs = create_clubs(schools, students, teachers, talent_map)
    competition = create_competitions_and_results(schools, students, talent_map, teachers[0])

    Announcement.objects.get_or_create(
        title=f'{DEMO_PREFIX} Competition Results Published',
        defaults={
            'content': 'Temporary announcement for frontend testing.',
            'scope': 'national',
            'country': country,
            'is_active': True,
            'published_at': timezone.now(),
        },
    )
    Message.objects.get_or_create(
        sender=teachers[0],
        recipient=student_users[0],
        subject=f'{DEMO_PREFIX} Welcome',
        defaults={'body': 'Welcome to the temporary student test account.'},
    )
    Notification.objects.get_or_create(
        recipient=student_users[0],
        title=f'{DEMO_PREFIX} New Result',
        defaults={'body': 'Your temporary competition result is available.', 'link': '/dashboard/student'},
    )
    AuditLog.objects.get_or_create(
        actor=talent_admin,
        action='seed_demo_data',
        model_name='DemoDataset',
        object_id=DEMO_PREFIX,
        defaults={'changes': {'schools': len(schools), 'students': len(students), 'clubs': len(clubs)}},
    )

    print('--- Temporary demo data populated ---')
    print(f'Country: {country.name}')
    print(f'Zone: {zone.name}')
    print(f'Region: {region.name}')
    print(f'Districts: {len(districts)}')
    print(f'Schools: {len(schools)}')
    print(f'Students: {len(students)}')
    print(f'Clubs: {len(clubs)}')
    print(f'Talents: {len(talent_map)}')
    print(f'Competition: {competition.name}')
    print('Demo password for all generated accounts: DemoPass123!')


if __name__ == '__main__':
    populate()
