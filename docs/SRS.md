# Software Requirements Specification

## 1. Introduction

### 1.1 Purpose
This document describes the current implementation and requirements of the Talent in School Management System. The application is built as a Django backend for managing school talent records, competitions, results, and administrative roles across a geographic school network.

### 1.2 Project scope
The system supports:

- geographic administration through country, zone, region, district, and ward records
- school registration and school-linked users
- student profiles and talent tracking
- school clubs and club membership management
- competition setup, participation, and judging
- results with grading, ranking, promotion, and award logic
- announcement management by geographic scope
- REST API access for integration and downstream clients

## 2. Current system overview

The project currently implements a backend-first system with a layered Django architecture:

- `core` handles geography, schools, users, and shared administrative data
- `students` handles student and parent records
- `competitions` handles competition lifecycle and participation
- `results` handles scoring, ranking, and promotion
- `config` contains the Django project settings and URL routing

## 3. Functional requirements

### 3.1 Geographic hierarchy
The application defines a hierarchical geographic model:

- Country
- Zone
- Region
- District
- Ward
- School

Each school is required to be linked to all relevant geographic levels, which supports scoped visibility and administrative controls.

### 3.2 Role model
The custom `User` model extends Django's default user object and includes role-based access with the following choices:

- `talent_admin`
- `region_manager`
- `zone_manager`
- `district_manager`
- `ward_manager`
- `head_teacher`
- `sport_teacher`
- `student`
- `parent`

The app also includes a separate `Parent` model and a linked `Student.parent` relationship for guardian access to child records.

### 3.3 Student and talent management
Students are created in the `students` app and linked to a school. Each student may be associated with one or more talent records through `StudentTalent`.

The talent model supports categories such as:

- Music
- Sports
- Technology
- Arts
- Academics
- Other

### 3.4 Club management
The `core` app defines clubs and membership logic:

- schools can have multiple clubs
- each club can be assigned teachers and talents
- student membership is tracked through `StudentClubMembership`
- the model enforces a recommended club limit based on school size

### 3.5 Competition management
Competitions are stored in the `competitions` app and can be scoped to a level such as:

- East Africa
- Country
- Zone
- Region
- District
- Ward
- School

A `GenericForeignKey` is used through `content_type` and `object_id` to attach a competition to a geographic location.

Participation is tracked through `CompetitionParticipation`, which records:

- competition
- student
- joined_at
- score
- status (`registered`, `finished`, `disqualified`)

### 3.6 Result management
Results are captured in the `results` app and include:

- score
- grade
- grade_points
- award
- rank
- approval status

The grade scale implemented in the model is:

- A+
- A
- A-
- B+
- B
- B-
- C+
- C
- C-
- D+
- D
- E
- F

Awards require a minimum grade of B+ in the validation logic.

### 3.7 Announcement management
The `Announcement` model supports a scope of:

- national
- zone
- region
- district
- school

Announcements can also be tied to a geographic entity using optional country, zone, region, district, and school foreign keys.

## 4. Data model summary

### 4.1 Key entities

- Country
- Zone
- Region
- District
- Ward
- School
- User
- Parent
- Student
- Talent
- StudentTalent
- Club
- Competition
- CompetitionParticipation
- CompetitionJudge
- Result
- ResultDetail
- ResultPromotion
- Announcement

### 4.2 Relationships

- Each `School` belongs to a country, zone, region, district, and ward.
- Each `Student` belongs to a school and can optionally belong to a parent.
- Each `User` may be assigned a role and optional school/geographic scope.
- Each `Competition` may be tied to a geographic object via GenericForeignKey.
- Each `CompetitionParticipation` links one student to one competition.
- Each `Result` is linked to one participation and can be promoted to a higher level.

## 5. API design

The project exposes a REST API using Django REST Framework and a default router. Main API prefixes include:

- `/api/`
- `/api/token/`
- `/api/token/refresh/`

The router registers endpoints for all main models, including countries, schools, students, talents, competitions, results, clubs, and announcements.

## 6. Security and quality requirements

Relevant implementation points include:

- use of Django's built-in auth and custom role model
- use of foreign key constraints and unique constraints
- validation of school/zone/region/district/ward consistency in admin forms
- restricted admin-based data references and protected related records
- JWT authentication for API access

## 7. Deployment and setup

### 7.1 Local setup

```bash
cd backend
python -m venv vee
source vee/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 7.2 Access points

- Admin dashboard: http://127.0.0.1:8000/admin/
- API root: http://127.0.0.1:8000/api/

## 8. Current project status

The application is a working backend implementation for a talent management platform, with the data model and API structure already established. The next likely phase would be expanding frontend interfaces, adding stricter access policies, and increasing test coverage.

---
End of SRS.