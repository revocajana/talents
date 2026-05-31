import os
import sys

# Add project root (the directory containing manage.py) to PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

# Add the backend package directory so that "core" and other apps can be imported as top‑level modules
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
import django
django.setup()

# Imports
from core.models import School
from students.models import Student
from competitions.models import Competition, CompetitionParticipation
from django.utils import timezone

def create_students():
    """Create sample students linked to existing schools and optionally enroll them in competitions."""
    # Get a few schools (assuming they already exist from populate_mwanza)
    schools = list(School.objects.all()[:5])
    if not schools:
        print("No schools found – run core population script first.")
        return []

    student_data = [
        {"first_name": "Asha", "last_name": "Mwinyi", "gender": "F", "student_id": "S001"},
        {"first_name": "Juma", "last_name": "Kikuyu", "gender": "M", "student_id": "S002"},
        {"first_name": "Fatma", "last_name": "Suleiman", "gender": "F", "student_id": "S003"},
        {"first_name": "Moses", "last_name": "Lugoye", "gender": "M", "student_id": "S004"},
        {"first_name": "Grace", "last_name": "Mbala", "gender": "F", "student_id": "S005"},
    ]

    created_students = []
    for i, data in enumerate(student_data):
        school = schools[i % len(schools)]
        student, _ = Student.objects.get_or_create(
            student_id=data["student_id"],
            defaults={
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "gender": data["gender"],
                "school": school,
            },
        )
        created_students.append(student)
    return created_students

def enroll_in_competitions(students):
    """Create a sample competition and enroll provided students."""
    # Create a sample competition at the school level (or any level you prefer)
    competition, _ = Competition.objects.get_or_create(
        name="Regional Math Contest",
        level="school",
        defaults={
            "description": "A math competition for primary schools.",
            "start_date": timezone.now().date(),
        },
    )
    # Enroll each student
    for student in students:
        CompetitionParticipation.objects.get_or_create(
            competition=competition,
            student=student,
            defaults={"status": "registered"},
        )
    print(f"Enrolled {len(students)} students in {competition.name}")

def populate():
    students = create_students()
    if students:
        enroll_in_competitions(students)
    print("--- Student data populated ---")
    print(f"Total students: {Student.objects.count()}")

if __name__ == "__main__":
    populate()
