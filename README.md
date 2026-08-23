# Talent in School Management System

A Django-based school talent management platform for tracking student talent, clubs, competitions, results, announcements, and geographic administration across a school network.

## Project overview

This system is designed for schools and education administrators to manage:

- geographic hierarchy data such as country, zone, region, district, and ward
- school records and user access
- student profiles and associated talent records
- school clubs and club memberships
- competitions and participation
- result entry, grading, promotion, and awards
- announcements scoped to a country, zone, region, district, or school

The application currently focuses on the backend and API layer. The codebase includes Django models, admin configuration, serializers, viewsets, and JWT authentication.

## Tech stack

- Backend: Django
- API: Django REST Framework
- Authentication: djangorestframework-simplejwt
- Database: MySQL / MariaDB compatible schema
- Admin: Django admin

## Current repository structure

```text
├── backend/              # Django project and API code
│   ├── config/           # Django settings and URL config
│   ├── core/             # geography, School, User, Talent, Club, Announcement models
│   ├── students/         # Student and Parent models and serializers/views
│   ├── competitions/     # Competition, participation, and judge models
│   ├── results/          # Result, ranking, and result promotion models
│   ├── manage.py         # Django project entry point
│   └── README.md         # backend-specific setup notes
├── docs/                 # project documentation
│   ├── SRS.md            # software requirements specification
│   └── requirements.txt  # project documentation dependencies
├── populate/             # data population scripts
├── README.md             # project overview
├── .gitignore
└── vee/                  # local Python virtual environment
```

## Primary user roles

The project currently defines these roles in the custom user model:

| Role | Purpose |
| --- | --- |
| talent_admin | overall administrative access |
| region_manager | manages a region scope |
| zone_manager | manages a zone scope |
| district_manager | manages a district scope |
| ward_manager | manages a ward scope |
| head_teacher | manages a school-level operation |
| sport_teacher | manages student registration, clubs, and results |
| student | views own profile and records |
| parent | views linked children data |

## Core domain modules

### Core

The `core` app defines the geographic hierarchy and the main school/account objects.

Entities include:

- Country
- Zone
- Region
- District
- Ward
- School
- User
- Parent
- Talent
- StudentTalent
- Announcement
- Club
- ClubTeacher
- ClubTalent
- StudentClubMembership

### Students

The `students` app stores:

- Student personal information
- school enrollment
- optional parent linkage
- student_id and date of birth

### Competitions

The `competitions` app supports:

- competitions scoped by geography using a generic foreign key
- competition participation records with score and status
- judges assigned to competitions

### Results

The `results` app stores:

- grade outcomes with A+ to F grading
- grade points and award categorization
- ranking and approvals
- detailed talent-level breakdowns
- result promotion records across competition levels

## API endpoints

The project exposes REST routes under `/api/` through a DRF router.

Examples include:

- `/api/countries/`
- `/api/schools/`
- `/api/students/`
- `/api/parents/`
- `/api/talents/`
- `/api/competitions/`
- `/api/participants/` and `/api/participations/`
- `/api/results/`
- `/api/clubs/`
- `/api/announcements/`

Authentication endpoints are also included:

- `/api/token/`
- `/api/token/refresh/`

## Quick start

```bash
cd backend
python -m venv vee
source vee/bin/activate   # Windows: vee\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Then open:

- admin: http://127.0.0.1:8000/admin/
- API: http://127.0.0.1:8000/api/

## Notes

This project is currently a backend-first implementation. The codebase includes the underlying data model and API foundations for a broader talent management system, but the frontend application is not present in this workspace as a separate app at this stage.