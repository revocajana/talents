# Talent in School Management System

A comprehensive management platform designed to track, manage, and promote student talents across schools in the East African region. The system facilitates role-based access for stakeholders ranging from Parents and Students to National-level administrators.

## Key Features

*   **Multi-Tier Governance**: Support for Country, Region, District, and Ward level management.
*   **Role-Based Dashboards**: Tailored experiences for 8 distinct user roles including Super Admin, Sport Teachers, Parents, and Students.
*   **Talent Tracking**: Manage up to 5 unique talents per student across categories like Music, Technology, and Sports.
*   **Competition Hierarchy**: Progress results through School, District, Zone, and National levels.
*   **Result Management**: Automated grading (A+ to F), grade point calculation, and "Top 3" award recognition.
*   **Announcement System**: Targeted communication based on geographic scope with automated lifecycle management.
*   **Security First**: CSRF protection, session hardening (2-minute timeout), and XSS mitigation.

## 🛠 Tech Stack

*   **Backend**: Django (djagorestframework, djangorestframework-simplejwt)
*   **Database**: MySQL/MariaDB (Normalized schema)
*   **Frontend**: React (Device-Responsive Design)

## 📂 Project Structure

```text
|── api/          # rest API
├── backend/          # Django application
├── frontend/         # React application
├── docs/             # Documentation
├── populate/        # populating scripts
├── .gitignore
|── vee/              # The virtual env      
└── README.md            
```


## 👥 User Roles

| Role | Responsibility |
| :--- | :--- |
| **Super Admin** | Full system control and administrative user management. |
| **District/Ward Manager** | Oversight and result promotion within their geographic scope. |
| **Head Teacher** | School-level oversight and teacher management. |
| **Sport Teacher** | Student registration, club management, and result entry. |
| **Student** | Participate in competitions and view personal results. |
| **Parent** | Monitor performance for one or more linked children. |

## 🛡 Security

*   **Session Management**: Automatic logout after 120 seconds of inactivity to protect user data.
*   **Data Integrity**: Normalized database with foreign key constraints and strict cascade policies for geographic data.
*   **CSRF Protection**: Security tokens enforced on critical state-changing operations.

---
*Developed for the enhancement of talent recognition in the education sector.*