# Backend documentation

This directory contains the Django backend for the Talent in School Management System.

## Application modules

- `config` – project settings, database configuration, JWT auth, and root URL registration
- `core` – country, zone, region, district, ward, school, user, talent, club, announcement, and evaluation models
- `students` – student and parent models, serializers, and scoped viewsets
- `competitions` – competition lifecycle, participation records, and judging logic
- `results` – result records, ranking, detail entries, promotions, and approval workflow

## Initial setup

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

## Access URLs

- Admin: http://127.0.0.1:8000/admin/
- API root: http://127.0.0.1:8000/api/
- Token login: http://127.0.0.1:8000/api/token/
- Token refresh: http://127.0.0.1:8000/api/token/refresh/

## Features currently implemented

- geographic hierarchy management
- school registration and admin configuration
- custom user roles and scoped access
- student and parent record management
- talent tracking using `StudentTalent`
- club creation, teacher assignments, and membership tracking
- competition setup, approval, and judge assignment
- result calculation, ranking, award validation, and approval workflow
- announcement records scoped by geography or school
- evaluation and submission workflows for student talent performance

## Notes

The repository includes a working Django API and a separate React frontend application. The backend documentation reflects the actual implementation in the codebase, including the permission model, router registration, and model relationships currently present in the project.