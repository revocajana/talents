# Talent in School Management System

A full-stack school talent management system built with Django and a React + Vite frontend. The platform supports geographic administration, school records, student talent tracking, club management, competitions, result approval, and scoped announcements.

## Project overview

This system supports school administrators and education teams in managing:

- geographic hierarchy data, including country, zone, region, district, and ward
- school records, user accounts, and role-based access
- student profiles and linked talent records
- school clubs and club memberships
- competitions and competition participation
- grade-based results, rankings, awards, and approvals
- announcements scoped by geography or school

The repository currently includes both the Django backend API and a separate frontend application.

## Tech stack

- Backend: Django
- API: Django REST Framework
- Authentication: JWT via djangorestframework-simplejwt
- Frontend: React + Vite
- Database: MySQL / MariaDB-compatible schema
- Admin: Django admin

## Repository structure

```text
├── backend/                 # Django project and API code
│   ├── config/              # settings and root URL config
│   ├── core/                # geographic models, users, talents, clubs, announcements
│   ├── students/            # student and parent models, serializers, and views
│   ├── competitions/        # competitions, participation, and judges
│   ├── results/             # result models, rankings, promotions, and details
│   ├── manage.py            # Django project entry point
│   └── README.md            # backend-specific notes
├── frontend/                # React + Vite frontend app
│   ├── src/                 # UI source code
│   ├── package.json         # frontend dependencies and scripts
│   └── README.md            # frontend template notes
├── docs/                    # documentation files
│   ├── SRS.md               # system requirements specification
│   └── requirements.txt     # documentation dependencies
├── populate/                # data population scripts
├── README.md                # project overview
├── .gitignore
├── .env.example             # sample environment variables
└── venv/                    # local Python virtual environment
```

## Primary user roles

The project defines these roles in the custom user model:

| Role | Purpose |
| --- | --- |
| talent_admin | overall administrative access |
| region_manager | manages region-level operations |
| zone_manager | manages zone-level operations |
| district_manager | manages district-level operations |
| ward_manager | manages ward-level operations |
| head_teacher | manages school-level operations |
| sport_teacher | manages student registration, clubs, and results |
| student | views own profile and linked records |
| parent | views linked child data |

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
- EvaluationCriterion
- TalentEvaluation
- EvaluationScore
- TalentSubmission
- SubmissionFeedback
- Message
- Notification
- AuditLog

### Students

The `students` app stores:

- student personal information
- school enrollment data
- optional parent linkage
- unique student IDs and date-of-birth records

### Competitions

The `competitions` app supports:

- competition setup and approval workflow
- geographic or school-level scoping
- participant registration
- judge assignment and scoring roles

### Results

The `results` app stores:

- grade outcomes from A+ to F
- award and ranking data
- competition result detail records
- result promotion records across levels
- approvals and audit metadata

## API endpoints

The Django API is exposed under `/api/` using a DRF router. Current routes include:

- `/api/countries/`
- `/api/zones/`
- `/api/regions/`
- `/api/districts/`
- `/api/wards/`
- `/api/schools/`
- `/api/users/`
- `/api/students/`
- `/api/parents/`
- `/api/talents/`
- `/api/student-talents/`
- `/api/announcements/`
- `/api/competitions/`
- `/api/participations/`
- `/api/competition-judges/`
- `/api/results/`
- `/api/result-details/`
- `/api/result-promotions/`
- `/api/clubs/`
- `/api/club-teachers/`
- `/api/club-talents/`
- `/api/club-memberships/`
- `/api/evaluation-criteria/`
- `/api/evaluations/`
- `/api/evaluation-scores/`
- `/api/talent-submissions/`
- `/api/submission-feedback/`
- `/api/messages/`
- `/api/notifications/`
- `/api/audit-logs/`

Authentication endpoints:

- `/api/token/`
- `/api/token/refresh/`

## Quick start

### Backend

```bash
cd backend
python -m venv venv
# Linux/macOS
source venv/bin/activate
# Windows
# venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Then open:

- admin: http://127.0.0.1:8000/admin/
- API: http://127.0.0.1:8000/api/

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open the Vite app at:

- http://localhost:5173

## Notes

This project is actively implemented as a backend-first system with a React frontend in the same repository. The backend contains the main domain logic, permissions, serializers, and API endpoints, while the frontend provides the user-facing interface for interacting with the platform.