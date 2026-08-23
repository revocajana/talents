# Backend documentation

This directory contains the Django backend for the Talent in School Management System.

## Application modules

- `config` – project settings and root URL configuration
- `core` – geographic hierarchy, school records, user roles, talents, clubs, and announcements
- `students` – student and parent models, serializers, and views
- `competitions` – competition lifecycle, participation, and judging logic
- `results` – grading, rankings, awards, and promotion records

## Initial setup

```bash
cd backend
python -m venv vee
source vee/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Access URLs

- Admin: http://127.0.0.1:8000/admin/
- API: http://127.0.0.1:8000/api/
- Token login: http://127.0.0.1:8000/api/token/
- Token refresh: http://127.0.0.1:8000/api/token/refresh/

## Features currently implemented

- geographic hierarchy management
- school registration and admin forms
- custom user roles and scoped access
- student record management
- talent tracking using `StudentTalent`
- club creation and membership tracking
- competition setup with generic geographic scope
- result calculation and award validation
- announcement records by geographic scope

## Notes

The repository currently contains the backend and API foundation for the system. The frontend is not included in this workspace as a separate application, and the current documentation reflects the actual implemented code rather than an aspirational design.