# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This document describes the requirements and implementation of the **Talent in School Management System**, a web platform for managing student talents, results, clubs, and administrative activities across Tanzanian schools.

### 1.1.1 Technology Stack
- **Backend**: Django 6.x, Django REST Framework, SimpleJWT
- **Database**: MySQL / MariaDB
- **Frontend**: React (future API consumption)

### 1.2 Scope
The system provides:
- Role‑based user management (Super Admin, Admin, Region Manager, Zone Manager, District Manager, Ward Manager, Head Teacher, Sport Teacher, Student, Parent)
- Geographic hierarchy (Country → Zone → Region → District → Ward)
- School management linked to the hierarchy
- Student enrollment and talent tracking (up to 5 talents per student)
- Competition management scoped to any geographic level using a GenericForeignKey
- Participation tracking via a through model (`CompetitionParticipation`)
- Result aggregation and promotion through School → District → Zone → National levels
- Announcements scoped by geography

## 2. Overall Description

### 2.1 Product Perspective
The platform is a multi‑tier web application where each role has a dedicated dashboard. Data visibility follows the geographic hierarchy; a manager only sees records belonging to their scope.

### 2.2 User Roles & Permissions
| Role | Description |
|------|-------------|
| **Super Admin** | Full system access, can create any other user. |
| **Admin** | Manages regional structures and can create managers. |
| **Region Manager** | Oversees all zones, districts, wards, schools within a region. |
| **Zone Manager** | Oversees districts and wards within a zone. |
| **District Manager** | Oversees wards and schools within a district. |
| **Ward Manager** | Oversees schools within a ward. |
| **Head Teacher** | Manages a single school (users, students, competitions). |
| **Sport Teacher** | Registers students, creates clubs, uploads results. |
| **Student** | Views own profile, talents, results, and announcements. |
| **Parent** | Views results and announcements for linked children (one‑to‑many). |

### 2.3 Operating Environment
- Modern web browser (Chrome/Firefox/Edge/Safari)
- MySQL server reachable from the Django container

## 3. System Features

### 3.1 Authentication & Authorization
- JWT‑based stateless authentication.
- Role‑based permissions enforced in the API and admin UI.

### 3.2 Competition Management
- `Competition` can be linked to any geographic entity using a `GenericForeignKey` (`content_type`, `object_id`).
- `CompetitionParticipation` links a `Student` to a `Competition` with additional fields (`joined_at`, `score`, `status`).
- Status choices: `registered`, `finished`, `disqualified`.

### 3.3 Result Management
- Results are stored per competition level (School, District, Zone, National).
- Automatic promotion logic moves results up the hierarchy.
- Top‑3 talent recognition per competition, awarded only to grades **B+** or higher.

### 3.4 Announcement System
- Announcements are created at any geographic level and visible to users within that scope.
- End‑date cleanup removes stale announcements.

## 4. Data Model

### 4.1 Entities
- **Country** – `name`, `code`
- **Zone** – `country` (FK), `name`
- **Region** – `zone` (FK), `name`
- **District** – `region` (FK), `name`
- **Ward** – `district` (FK), `name`
- **School** – `registry_number`, `name`, `ownership_type`, FK to each geographic level, `phone`, `email`
- **User** – extends `AbstractUser`; fields: `role` (includes new `region_manager` and `zone_manager`), optional FK to `School`
- **Parent** – custom model with login credentials, linked to many `Student`s via a lookup table.
- **Student** – `first_name`, `last_name`, `gender`, `student_id`, FK to `School`
- **Competition** – `name`, `description`, `level` (choices), `start_date`, `end_date`, `content_type`, `object_id` (GenericForeignKey), many‑to‑many `schools`, many‑to‑many `participants` through `CompetitionParticipation`.
- **CompetitionParticipation** – `competition` (FK), `student` (FK), `joined_at`, `score`, `status`.
- **Result** – (future) tracks scores per competition level.
- **Announcement** – title, description, talent category, venue, start/end datetime, creator, geographic FK fields.

## 5. Implementation & Deployment

### 5.1 Commands
```bash
# virtualenv
python3 -m venv vee
source vee/bin/activate

# install deps
pip install -r requirements.txt

# make and apply migrations (creates all tables)
python3 backend/manage.py makemigrations
python3 backend/manage.py migrate

# populate core geographic data (Mwanza example)
python3 backend/core/populate_mwanza.py

# populate demo students and a sample competition
python3 backend/students/populate_students.py
```

### 5.2 Future Work
- Add API layer (`api/` app) using Django REST Framework.
- Implement frontend consumption of the API.
- Write unit/integration tests for competition participation.

---
*End of SRS*