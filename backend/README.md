# Backend

This directory contains the Django backend for the **Talent in School Management System**.

## Django apps

- `core` – geographic hierarchy (Country, Zone, Region, District, Ward) and school model.
- `students` – `Student` and `Parent` models, plus admin registration.
- `competitions` – `Competition` model with a `GenericForeignKey` for any geographic level and the through model `CompetitionParticipation` linking students to competitions.
- `results` – (future) result tracking for competitions.

## Quick start

```bash
# 1. Create and activate a virtual environment
python3 -m venv vee
source vee/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply migrations (creates all tables)
python3 backend/manage.py makemigrations
python3 backend/manage.py migrate

# 4. Populate core geographic data (Mwanza example)
python3 backend/core/populate_mwanza.py

# 5. Populate demo students and a sample competition
python3 backend/students/populate_students.py
```

## Running the server

```bash
python3 backend/manage.py runserver
```

Visit `http://127.0.0.1:8000/admin/` (default super‑admin credentials are created by the core population script).
