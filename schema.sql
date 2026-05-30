-- Talent in School Management System - Database Schema
-- Based on SRS.md

CREATE DATABASE IF NOT EXISTS talents;
USE talents;

-- 1. Schools Table
-- Ownership Type is flexible (Government, Private, Religious, NGO, etc.)
CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registry_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    ownership_type VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    phone VARCHAR(20), -- Optional
    email VARCHAR(100), -- Optional
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Unified Authentication)
-- Roles: super_admin, admin, district_manager, ward_manager, head_teacher, sport_teacher
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20), -- Optional
    role ENUM('super_admin', 'admin', 'district_manager', 'ward_manager', 'head_teacher', 'sport_teacher') NOT NULL,
    school_id INT NULL,
    region VARCHAR(100),
    district VARCHAR(100),
    ward VARCHAR(100),
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- 3. Parents Table
CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    age INT,
    standard VARCHAR(20),
    school_id INT NOT NULL,
    club VARCHAR(100),
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- 5. Student Talents (Supporting up to 5 talents per student)
CREATE TABLE student_talents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    talent_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    -- Logical constraint: Application level should limit to 5
    UNIQUE KEY unique_student_talent (student_id, talent_name)
);

-- 6. Parent-Student Relationship (One-to-Many/Many-to-Many)
-- SRS specifies one parent can have many students.
CREATE TABLE parent_student_lookup (
    parent_id INT NOT NULL,
    student_id INT NOT NULL,
    PRIMARY KEY (parent_id, student_id),
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 7. Results Table
-- Tracks performance across School, District, Zone, and National levels.
CREATE TABLE results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    competition_number INT NOT NULL, -- 1 to 4
    competition_year INT NOT NULL,
    competition_level ENUM('School', 'District', 'Zone', 'National') DEFAULT 'School',
    talent_name VARCHAR(100) NOT NULL,
    total_score DECIMAL(5,2) NOT NULL, -- 0-100
    grade VARCHAR(5) NOT NULL, -- A+, A, B, etc.
    grade_point DECIMAL(3,1) NOT NULL, -- 1.0 to 4.5
    status ENUM('Pending', 'Promoted') DEFAULT 'Pending',
    auto_remarks VARCHAR(255),
    remarks TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 8. Announcements Table
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    talent_category VARCHAR(100),
    venue VARCHAR(200),
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    created_by INT NOT NULL,
    region VARCHAR(100),
    district VARCHAR(100),
    ward VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX idx_student_school ON students(school_id);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_level ON results(competition_level);
CREATE INDEX idx_announcements_dates ON announcements(start_datetime, end_datetime);

-- Trigger example for "Top 3" business logic (Conceptual)
-- Logic for "Awarded" status as per SRS 3.2:
-- Identifying top 3 per talent with Grade >= B+ is typically handled via 
-- Window Functions in SELECT queries rather than static table columns 
-- to ensure real-time accuracy as marks change.

/* 
Example Query for Top 3 Awarded:
SELECT student_id, total_score, talent_name
FROM (SELECT *, RANK() OVER (PARTITION BY talent_name ORDER BY total_score DESC) as rank_val FROM results WHERE grade IN ('A+', 'A', 'B+')) as ranked
WHERE rank_val <= 3;
*/