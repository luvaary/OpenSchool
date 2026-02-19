# Usage Guide

## Quick Start

### 1. Static Mode (No Server)

```bash
# Option A: Python (built-in)
cd openschool
python -m http.server 8080

# Option B: Node.js
npx serve .

# Option C: Open directly
# Open index.html in a modern browser (some features may be limited)
```

Navigate to `http://localhost:8080/login.html` to begin.

### 2. Server-Backed Mode

```bash
cd server
pip install -r requirements.txt
python app.py
```

Navigate to `http://localhost:5000`.

---

## Demo Accounts

| Username   | Role    | Password     |
|------------|---------|--------------|
| `admin`    | Admin   | (any value)  |
| `teacher`  | Teacher | (any value)  |
| `student`  | Student | (any value)  |

In static demo mode, passwords are not validated.

---

## Navigation

- **Dashboard** (`index.html`) - Role-adaptive home page with stats, announcements, timetable
- **Teacher** (`teacher.html`) - Class management, attendance, assignments, gradebook
- **Student** (`student.html`) - View assignments, grades, schedule, announcements
- **Admin** (`admin.html`) - User management, class management, school-wide reports
- **Class Detail** (`pages/class.html?id=...`) - Per-class roster, attendance, assignments

---

## Features by Role

### Admin
- View/manage all users and classes
- Publish school-wide announcements
- Export attendance and grade reports as CSV
- Generate printable report view

### Teacher
- Take attendance with quick-toggle buttons (Present/Absent/Late/Excused)
- Create and publish assignments
- Enter grades in the gradebook with weighted averages
- View class rosters and enrollment
- Export data as CSV

### Student
- View upcoming assignments and due dates
- Check grades and class averages
- See today's timetable schedule
- Read announcements

---

## Theme & Accessibility

### Theme Toggle
Click the **Dark** / **Light** button in the header to switch themes. Three themes are available:
- Light (default)
- Dark
- High-contrast (set via `data-theme="high-contrast"` on `<html>`)

Theme preference is saved in `localStorage`.

### Reduced Motion
Click the **Motion** button to disable animations. This also respects `prefers-reduced-motion` at the OS level.

### Keyboard Navigation
- **Tab** / **Shift+Tab** to navigate interactive elements
- **Escape** to close modals
- **Skip link** appears on focus at the top of every page
- All form fields have proper labels and ARIA attributes

---

## Data Storage

### Static Mode
- Sample data loaded from `data/sample/*.json` on first visit
- Changes saved to `localStorage` (prefix: `openschool_`)
- Reset all data: call `resetAllData()` from the browser console

### Server Mode
- SQLite database at `server/instance/openschool.db`
- Flask REST API with session-based authentication
- See `server/README.md` for API documentation

---

## CSV Export

Most data views include an **Export CSV** button. Exported files include:
- Attendance records (date, class, student, status, notes)
- Grade distributions (student, class, assignment, points, letter grade)
- Full data export (all attendance records)

Files are downloaded directly to your browser's download folder.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Page shows "Loading..." indefinitely | Check browser console for errors. Ensure JSON files exist in `data/sample/`. |
| Styles not loading | Serve via HTTP server, not `file://` protocol. |
| Login redirects back to login | Clear `localStorage` and try again. |
| Export button does nothing | Check that data exists for the selected class/date range. |
