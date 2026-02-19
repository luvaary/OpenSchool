# Data Directory — Field Reference

> Purpose: Documents every JSON data file, field meanings, types, and CSV import/export mapping.

## Overview

All sample data lives in `data/sample/`. In static mode the app loads these JSON files
directly via `fetch()`. For production, switch to the optional server-backed API
(see `server/README.md`).

---

## `users.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique user ID (e.g. `u-student-001`) |
| `username` | string | ✅ | Login handle (3-32 chars) |
| `display_name` | string | ✅ | Full name for display |
| `role` | enum | ✅ | `admin` / `teacher` / `student` / `parent` |
| `email` | string | ✅ | Contact email |
| `active` | boolean | ✅ | Account active flag |
| `year_level` | int\|null | — | Year/grade level (students only) |
| `created_at` | ISO 8601 | — | Account creation timestamp |
| `avatar_url` | string\|null | — | Path to avatar image |

**CSV mapping:** `id,username,display_name,role,email,active,year_level`

---

## `classes.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique class ID |
| `name` | string | ✅ | Display name (e.g. "10A English") |
| `subject` | string | ✅ | Subject area |
| `teacher_id` | string | ✅ | FK → users.id |
| `year_level` | int | ✅ | Year/grade |
| `period` | string | ✅ | Timetable period label |
| `room` | string | — | Room/location |
| `color` | string | — | Hex color for UI |
| `active` | boolean | — | Active flag |

**CSV mapping:** `id,name,subject,teacher_id,year_level,period,room,color,active`

---

## `enrollments.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Enrollment record ID |
| `student_id` | string | ✅ | FK → users.id |
| `class_id` | string | ✅ | FK → classes.id |
| `enrolled_at` | date | ✅ | Enrollment date (YYYY-MM-DD) |
| `status` | enum | — | `active` / `withdrawn` / `completed` |

**CSV mapping:** `id,student_id,class_id,enrolled_at,status`

---

## `assignments.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Assignment ID |
| `class_id` | string | ✅ | FK → classes.id |
| `title` | string | ✅ | Title |
| `description` | string | — | Full instructions |
| `created_by` | string | ✅ | FK → users.id (teacher) |
| `created_at` | ISO 8601 | — | Creation timestamp |
| `due_date` | ISO 8601 | ✅ | Due date/time |
| `max_points` | number | ✅ | Maximum points possible |
| `weight` | number | — | Grade weight factor (0–1) |
| `resources` | array | — | `[{label, url}]` linked materials |
| `status` | enum | — | `draft` / `published` / `closed` |

**CSV mapping:** `id,class_id,title,created_by,due_date,max_points,weight,status`

---

## `submissions.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Submission ID |
| `assignment_id` | string | ✅ | FK → assignments.id |
| `student_id` | string | ✅ | FK → users.id |
| `submitted_at` | ISO 8601 | ✅ | Submission timestamp |
| `content` | string | — | Text body |
| `file_path` | string\|null | — | Attachment path |
| `grade` | number\|null | — | Points awarded |
| `feedback` | string\|null | — | Teacher comments |
| `graded_at` | ISO 8601\|null | — | When graded |
| `status` | enum | — | `submitted` / `graded` / `returned` / `late` |

**CSV mapping:** `id,assignment_id,student_id,submitted_at,grade,status`

---

## `attendance.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Record ID |
| `class_id` | string | ✅ | FK → classes.id |
| `student_id` | string | ✅ | FK → users.id |
| `date` | date | ✅ | YYYY-MM-DD |
| `status` | enum | ✅ | `present` / `absent` / `late` / `excused` |
| `recorded_by` | string | — | FK → users.id (teacher) |
| `recorded_at` | ISO 8601 | — | Recording timestamp |
| `note` | string\|null | — | Optional note |

**CSV mapping (export):** `date,class_id,student_id,status,note`

---

## `grades.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Grade record ID |
| `student_id` | string | ✅ | FK → users.id |
| `class_id` | string | ✅ | FK → classes.id |
| `assignment_id` | string | ✅ | FK → assignments.id |
| `points` | number | ✅ | Points awarded |
| `max_points` | number | ✅ | Maximum possible |
| `weight` | number | — | Weight factor (0–1) |
| `letter_grade` | string\|null | — | Letter grade |
| `graded_by` | string | — | FK → users.id |
| `graded_at` | ISO 8601 | — | Grading timestamp |
| `comments` | string\|null | — | Comments |

**CSV mapping:** `id,student_id,class_id,assignment_id,points,max_points,letter_grade`

---

## `timetable.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Slot ID |
| `class_id` | string | ✅ | FK → classes.id |
| `day` | enum | ✅ | `monday`–`friday` |
| `start_time` | HH:MM | ✅ | 24-hour start |
| `end_time` | HH:MM | ✅ | 24-hour end |
| `room` | string | — | Location |
| `teacher_id` | string | — | FK → users.id |
| `color` | string | — | Hex color |

**CSV mapping:** `id,class_id,day,start_time,end_time,room,teacher_id`

---

## `announcements.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Announcement ID |
| `title` | string | ✅ | Headline |
| `content` | string | ✅ | HTML body (safe subset) |
| `author_id` | string | ✅ | FK → users.id |
| `published` | boolean | ✅ | Published state |
| `created_at` | ISO 8601 | ✅ | Creation time |
| `updated_at` | ISO 8601\|null | — | Last edit time |
| `visible_to` | array | ✅ | Roles array: `["admin","teacher","student","parent"]` |
| `priority` | enum | — | `normal` / `important` / `urgent` |
| `expires_at` | ISO 8601\|null | — | Expiry datetime |

**CSV mapping:** `id,title,author_id,published,priority,visible_to`

---

## Migration from Schoolbox / Compass

1. Export CSV from your existing platform using the admin export tool.
2. Map columns to the CSV formats listed above (match by column header).
3. Use `scripts/csv-to-json.js` (or manually) to convert CSV → JSON.
4. Place output files in `data/sample/` (rename to `data/` for production).
5. Run `node scripts/schema-check.js` or `python scripts/schema_check.py` to validate.
