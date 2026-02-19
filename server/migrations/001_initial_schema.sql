-- ============================================================================
-- OpenSchool – Migration 001: Initial Schema
-- Creates all core tables.
-- Run: python server/app.py --init-db
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    email         TEXT,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    year_level    INTEGER,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS classes (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    teacher_id  TEXT NOT NULL REFERENCES users(id),
    room        TEXT,
    year_level  INTEGER,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enrollments (
    id          TEXT PRIMARY KEY,
    student_id  TEXT NOT NULL REFERENCES users(id),
    class_id    TEXT NOT NULL REFERENCES classes(id),
    enrolled_at TEXT DEFAULT (datetime('now')),
    UNIQUE(student_id, class_id)
);

CREATE TABLE IF NOT EXISTS assignments (
    id          TEXT PRIMARY KEY,
    class_id    TEXT NOT NULL REFERENCES classes(id),
    title       TEXT NOT NULL,
    description TEXT,
    due_date    TEXT NOT NULL,
    max_points  INTEGER NOT NULL DEFAULT 100,
    weight      REAL DEFAULT 1.0,
    status      TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
    created_by  TEXT REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
    id             TEXT PRIMARY KEY,
    assignment_id  TEXT NOT NULL REFERENCES assignments(id),
    student_id     TEXT NOT NULL REFERENCES users(id),
    submitted_at   TEXT DEFAULT (datetime('now')),
    content        TEXT,
    file_name      TEXT,
    status         TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'late', 'graded', 'returned')),
    UNIQUE(assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance (
    id          TEXT PRIMARY KEY,
    class_id    TEXT NOT NULL REFERENCES classes(id),
    student_id  TEXT NOT NULL REFERENCES users(id),
    date        TEXT NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by   TEXT REFERENCES users(id),
    note        TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS grades (
    id             TEXT PRIMARY KEY,
    assignment_id  TEXT NOT NULL REFERENCES assignments(id),
    student_id     TEXT NOT NULL REFERENCES users(id),
    points         REAL NOT NULL,
    letter         TEXT,
    feedback       TEXT,
    graded_by      TEXT REFERENCES users(id),
    graded_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS timetable (
    id          TEXT PRIMARY KEY,
    class_id    TEXT NOT NULL REFERENCES classes(id),
    day         TEXT NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
    start_time  TEXT NOT NULL,
    end_time    TEXT NOT NULL,
    room        TEXT
);

CREATE TABLE IF NOT EXISTS announcements (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    author_id   TEXT REFERENCES users(id),
    priority    TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    visible_to  TEXT DEFAULT '["admin","teacher","student"]',
    status      TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class   ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class   ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class    ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student  ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date     ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_grades_assignment   ON grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student      ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class     ON timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day       ON timetable(day);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
