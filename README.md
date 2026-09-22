# Talent in School Management System

This system helps schools and education administrators manage student talent records, competitions, results, and promotion flows across school, district, zone, and higher levels.

## What the system does

- Register and manage student and school information
- Track talent records and related academic or sports performance
- Create and manage school, district, and regional competitions
- Record results and evaluate performance by talent
- Promote results from one level to another in a structured flow
- Manage announcements for different user groups
- Support different roles such as administrators, managers, teachers, and students

## Tech stack

- Backend: Django + Django REST Framework
- Frontend: React + Vite
- Database: SQLite for local development/testing, with project support for PostgreSQL/MySQL-style setups depending on deployment

## Clone the project

```bash
git clone https://github.com/your-username/talents.git
cd talents
```

## Database configuration before migration

Before running migrations, configure the database connection in the Django settings file.

Open:

- backend/config/settings.py

Update the DATABASES section so it uses your MySQL connection settings. Example:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'talents_db',
        'USER': 'root',
        'PASSWORD': 'your_mysql_password',
        'HOST': '127.0.0.1',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    }
}
```

Make sure:

- the MySQL server is running
- the database name exists
- the user has permission to create tables and run migrations
- the password and host values match your local MySQL setup

If you are using a different database engine, change the ENGINE value accordingly, but make sure the database is ready before migration.

## Run the backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/macOS
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend will run at:

- http://127.0.0.1:8000

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:

- http://localhost:5173

## Notes

This project is meant to be run as two separate parts:

1. Django backend for APIs and business logic
2. React frontend for the user interface

To work on the project locally, start both servers in separate terminals and access the frontend in the browser.