# Data Schema Reference

All sample data lives in `data/sample/` as flat JSON files. Each file is an array of objects. Below are the schemas for each entity.

---

## Users (`users.json`)

```json
{
  "id": "string (UUID)",
  "username": "string (unique, lowercase)",
  "display_name": "string",
  "email": "string (valid email format)",
  "role": "admin | teacher | student | parent",
  "active": true,
  "year_level": "number | null (students only)",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

**Constraints**: `username` must be unique. `role` is one of four values. `year_level` applies to students only.

---

## Classes (`classes.json`)

```json
{
  "id": "string (UUID)",
  "name": "string",
  "subject": "string",
  "teacher_id": "string (references users.id)",
  "room": "string",
  "year_level": "number",
  "color": "string (hex color for UI)",
  "active": true,
  "created_at": "ISO 8601 datetime"
}
```

---

## Enrollments (`enrollments.json`)

```json
{
  "id": "string (UUID)",
  "student_id": "string (references users.id where role=student)",
  "class_id": "string (references classes.id)",
  "status": "active | withdrawn | completed",
  "enrolled_at": "ISO 8601 datetime"
}
```

**Constraints**: Each student-class pair should be unique. `status` defaults to `active`.

---

## Assignments (`assignments.json`)

```json
{
  "id": "string (UUID)",
  "class_id": "string (references classes.id)",
  "title": "string",
  "description": "string (HTML allowed for rich content)",
  "due_date": "ISO 8601 datetime",
  "max_points": "number (positive integer)",
  "weight": "number (0.0 to 1.0, for weighted grading)",
  "status": "draft | published | closed",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

---

## Submissions (`submissions.json`)

```json
{
  "id": "string (UUID)",
  "assignment_id": "string (references assignments.id)",
  "student_id": "string (references users.id)",
  "content": "string (student response text)",
  "status": "draft | submitted | graded | returned",
  "submitted_at": "ISO 8601 datetime | null",
  "grade_points": "number | null",
  "feedback": "string | null",
  "graded_at": "ISO 8601 datetime | null"
}
```

---

## Grades (`grades.json`)

```json
{
  "id": "string (UUID)",
  "student_id": "string (references users.id)",
  "class_id": "string (references classes.id)",
  "assignment_id": "string (references assignments.id)",
  "points": "number",
  "max_points": "number",
  "letter_grade": "string (A+, A, A-, B+, ... F)",
  "comments": "string | null",
  "graded_by": "string (references users.id, teacher/admin)",
  "graded_at": "ISO 8601 datetime"
}
```

**Letter Grade Scale**:
| Range    | Grade |
|----------|-------|
| 97-100   | A+    |
| 93-96    | A     |
| 90-92    | A-    |
| 87-89    | B+    |
| 83-86    | B     |
| 80-82    | B-    |
| 77-79    | C+    |
| 73-76    | C     |
| 70-72    | C-    |
| 67-69    | D+    |
| 63-66    | D     |
| 60-62    | D-    |
| 0-59     | F     |

---

## Attendance (`attendance.json`)

```json
{
  "id": "string (UUID)",
  "class_id": "string (references classes.id)",
  "student_id": "string (references users.id)",
  "date": "YYYY-MM-DD",
  "status": "present | absent | late | excused",
  "note": "string | null",
  "recorded_by": "string (references users.id)",
  "recorded_at": "ISO 8601 datetime"
}
```

---

## Announcements (`announcements.json`)

```json
{
  "id": "string (UUID)",
  "title": "string",
  "content": "string (HTML content from WYSIWYG editor)",
  "author_id": "string (references users.id)",
  "priority": "normal | important | urgent",
  "status": "draft | published",
  "visible_to": ["admin", "teacher", "student", "parent"],
  "published_at": "ISO 8601 datetime | null",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

---

## Timetable (`timetable.json`)

```json
{
  "id": "string (UUID)",
  "class_id": "string (references classes.id)",
  "day_of_week": "number (0=Monday, 4=Friday)",
  "start_time": "HH:MM (24h format)",
  "end_time": "HH:MM (24h format)",
  "room": "string",
  "term": "string (e.g. '2024-T1')"
}
```

---

## JSON Schema Files

Formal JSON Schema files are located at `data/schemas/`. Each schema follows JSON Schema Draft 2020-12 and can be used with standard validators:

```bash
# Validate with the included script
node scripts/schema-check.js
```

---

## Data Relationships

```
users ──< enrollments >── classes
  |                          |
  |── attendance             |── assignments ──< submissions
  |                          |                       |
  |── grades ────────────────|───────────────────────┘
  |
  └── announcements (author_id)
```

One user can have many enrollments, attendance records, grades, and submissions. Classes have many assignments and timetable slots.
