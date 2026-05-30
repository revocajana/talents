# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This document describes the requirements and actual implementation of the "Talent in School" Management System, a PHP-based web platform for managing student talents, results, clubs, and administrative activities in Tanzanian schools. The system supports multiple user roles and provides tools for talent tracking, result management, and communication across schools, districts, and wards.

### 1.2 Scope
The system provides:
- User management for Super Admin, Admin, District Manager, Ward Manager, Head Teacher, Sport Teacher, Student, and Parent roles
- Tracking of student talents, club memberships, and results across multiple competition levels
- Creation and management of announcements and events
- Role-based dashboards, profile management, and secure password reset
- Data scoping by school, district, ward, region, and country (East Africa scope)

### 1.3 Definitions
- **Super Admin**: System-wide administrator; manages all users and data
- **Admin**: Manages district/ward managers, head teachers, and sport teachers
- **District Manager**: Oversees schools and results in a district; manages district-level announcements and results
- **Ward Manager**: Oversees schools and results in a ward
- **Head Teacher**: Manages a single school
- **Sport Teacher**: Manages clubs and student talents in a school; registers students and uploads results
- **Student**: Participates in clubs and talent events; views own results, announcements, and profile
- **Parent**: Associated with one or more students; views performance results and relevant announcements for all linked children (supports multiple children per parent account)

---

## 2. Overall Description
### 2.1 Product Perspective
The system is a multi-tier management platform where each user role has a dedicated dashboard. It utilizes a centralized authentication system and enforces data scoping so users only see information relevant to their geographic or organizational level.

### 2.2 User Roles & Permissions
- **Super Admin**: Full access to all data and user management; only Super Admin can manage other admins
- **Admin**: Manages district/ward managers, head teachers, and sport teachers; cannot self-register
- **District Manager**: Manages results, announcements, and reports for their district; created by Admin
- **Ward Manager**: Manages results and reports for their ward; created by Admin
- **Head Teacher**: Manages school data, teachers, and students; created by Admin
- **Sport Teacher**: Registers students, manages clubs, uploads results; created by Admin or Head Teacher
- **Student**: Registered by Sport Teacher; cannot self-register; views own results, announcements, clubs, and profile (can possess up to 5 talents)
- **Parent**: Created by Admin or Sport Teacher; views results and announcements for linked student(s). A single parent account can be associated with multiple students.

### 2.3 Operating Environment
- Web browser (Chrome, Firefox, Edge, Safari)

### 2.4 Design Constraints
- **Data Integrity**: Cascade deletion is enforced. Deleting a School removes all associated Sport Teachers and Students.
- **Input Validation**: All forms require strict validation (e.g., marks between 0-100, specific file formats for profile images).
- **Session Life**: Active sessions expire after 120 seconds of inactivity.

---

## 3. System Features

### 3.1 User Authentication & Authorization
- **Unified Login**: A single entry point for all roles with automatic redirection based on assigned privileges.
- **Automated Password Recovery**: Users can request a reset by providing their email and phone number. If both match, the system generates a temporary password (Email + 4 digits) and notifies the user.
- **Admin-Led Resets**: Super Admins can manually override and set new passwords for Sport Teachers.

### 3.2 Result Management
- **Scored Entry**: Sport Teachers enter marks (0-100). The system automatically calculates Grade, Grade Point (GP), and Status.
- **Competition Phases**: Results are organized into four competitions (1-4) per academic year.
- **Competition Levels**: The system supports result tracking across four hierarchical levels: School Level, District Level, Zone Level, and National Level.
- **Top Talent Recognition**: The system identifies the top 3 students per talent category. Only students with a grade of B+ or higher are eligible for "Awarded" status.
- **Promotion Flow**: Results migrate upward through the hierarchy. Once promoted to a higher level (e.g., from School to District), the record becomes read-only for the lower-level administrators.

### 3.3 Announcement System
- **Targeted Delivery**: Announcements are created at the District/Ward level and visible to Students within that scope.
- **Lifecycle Management**: Announcements are scoped geographically (Country, Region, District, Ward) and classified as "Upcoming," "Live/Ongoing," or "Past."
- **Self-Cleaning Data**: The system automatically deletes announcement records once the "End Date" has passed to maintain database performance.

### 3.4 Security Features
- **CSRF Protection**: Critical actions (like updating student results) require a valid Anti-Forgery/CSRF token.
- **Session Hardening**: Sessions are cleared automatically upon timeout or role mismatch.
- **XSS Mitigation**: All user-generated content is sanitized/escaped before rendering.

---

## 4. Data Model

### 4.1 Entities
- **Country**: Name.
- **Region**: Name, Country ID.
- **District**: Name, Region ID.
- **Ward**: Name, District ID.
- **School**: Registry Number, Name, Ownership Type, Country ID, Region ID, District ID, Ward ID, Phone.
- **Student**: Name, Age, Standard, School ID, Unique Username, Club, Talents (up to 5), Profile Image.
- **Parent**: Name, Phone, Email, Unique Username, Password, Linked Student ID(s) (One-to-Many relationship).
- **Result**: Student ID, Competition Number (1-4), Competition Year, Competition Level (School/District/Zone/National), Total Score, Grade, Grade Point, Status (Pending/Promoted), Auto Remarks.
- **Announcement**: Title, Description, Category, Venue, Start/End Datetime, Created By, Country ID, Region ID, District ID, Ward ID.

---

## 5. Appendix

### 5.1 Grade & Point Scale
| Marks Range | Grade | Grade Point | Auto Remark |
|-------------|-------|-------------|-------------|
| 90 - 100    | A+    | 1.0         | Excellent   |
| 75 - 89     | A     | 1.5         | Very Good   |
| 60 - 74     | B+    | 2.0         | Good        |
| 50 - 59     | B     | 2.5         | Satisfactory|
| 40 - 49     | C     | 3.0         | Fair        |
| 30 - 39     | D     | 3.5         | Poor        |
| 20 - 29     | E     | 4.0         | Unsatisfactory|
| 0 - 19      | F     | 4.5         | Failed      |

### 5.2 Talent Categories
Music, Dance, Theater/Drama, Visual Arts, Literary Arts, Sports, Culinary Arts, Technology, Academic.

### 5.3 Competition Hierarchy
1. **School Level**: Initial entry by Sport Teachers.
2. **District Level**: Results promoted from schools within the district.
3. **Zone Level**: Results promoted from districts within the zone.
4. **National Level**: Final stage for top-tier talent recognition.

---

*End of SRS*