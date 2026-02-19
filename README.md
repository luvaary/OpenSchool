# OpenSchool

> **FOSS static web application replacing proprietary school platforms**
> (Schoolbox, Compass, and similar)

OpenSchool provides attendance tracking, assignments & submissions, a gradebook,
timetable display, and announcements - all in a lightweight, zero-dependency
static web app that runs from a single folder.

**Version 1.1** - Clean code, smooth animations, expanded documentation.

---

## What's New in v1.1

- **Clean code**: All emoji removed from source; CSS-only icons and text labels throughout
- **Smooth animations**: Staggered page-load transitions, card hover lifts, button press feedback, spring-eased modals
- **Micro-interactions**: Nav hover slide, form focus glow, toast slide-in with CSS status badges
- **Expanded docs**: New `docs/` folder with USAGE, SCHEMA, CODE_STYLE, and OPUS_REGEN guides
- **Polished themes**: Improved transition tokens, consistent comment formatting

---

## Features

| Module          | Description                                                |
|-----------------|------------------------------------------------------------|
| **Attendance**  | Quick toggle (present/absent/late/excused), history, CSV export |
| **Assignments** | Create, submit, grade with points & feedback               |
| **Gradebook**   | Weighted averages, letter grades, per-class views          |
| **Timetable**   | Today's schedule + full weekly grid                        |
| **Announcements** | WYSIWYG editor, priority levels, role-based visibility  |
| **Auth**        | Local authentication with role-based dashboards            |
| **Themes**      | Light, dark, and high-contrast modes                       |

## Tech Stack

- **HTML5** - semantic markup, ARIA landmarks
- **CSS3** - custom properties, Grid, Flexbox, three themes, animations
- **JavaScript** - vanilla ES2022 modules (zero frameworks)
- **Data** - JSON flat files + localStorage overlay
- **Optional** - Flask + SQLite backend, Node.js build tools

---

## Quick Start (Windows 11)

### Prerequisites

- **Python 3.12+** — [python.org/downloads](https://www.python.org/downloads/)
- **Node.js 18+ LTS** (optional, for build/minify) — [nodejs.org](https://nodejs.org/)

### One-Click Setup

```powershell
# Open PowerShell, navigate to the project
cd "C:\Users\AARY_SOUTHERNCROSS\Desktop\Main FOSS projects\openschool"

# Run the setup script
.\setup.ps1
```

This will:
1. Verify Python 3.12+ is installed
2. Create a virtual environment (`.venv`)
3. Install pip dependencies (`flask`, `bcrypt`)
4. Validate sample data against JSON schemas
5. Start a dev server at **http://localhost:8000**

### Manual Start (Static Mode)

```powershell
cd "C:\Users\AARY_SOUTHERNCROSS\Desktop\Main FOSS projects\openschool"
python -m http.server 8000
```

Open **http://localhost:8000** in your browser.

### Manual Start (Flask Mode)

```powershell
cd "C:\Users\AARY_SOUTHERNCROSS\Desktop\Main FOSS projects\openschool"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Initialize database with sample data
python server/app.py --init-db --seed

# Start server
python server/app.py --port 8000
```

---

## Quick Start (Linux / macOS)

```bash
cd openschool

# Static mode (no dependencies)
python3 -m http.server 8000

# Flask mode
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server/app.py --init-db --seed
python server/app.py --port 8000
```

---

## Demo Logins

| Username  | Password     | Role    |
|-----------|-------------|---------|
| `admin`   | `admin123`  | Admin   |
| `teacher` | `teacher123`| Teacher |
| `student` | `student123`| Student |

---

## Project Structure

```
openschool/
├── index.html              # Main dashboard
├── login.html              # Login page
├── teacher.html            # Teacher dashboard
├── student.html            # Student dashboard
├── admin.html              # Admin dashboard
├── setup.ps1               # Windows setup script
├── package.json            # Node.js config (build tools)
├── requirements.txt        # Python dependencies
│
├── pages/
│   └── class.html          # Per-class detail page
│
├── css/
│   ├── tokens.css          # Design tokens (colors, spacing, themes)
│   ├── styles.css          # Master stylesheet
│   ├── styles.min.css      # Minified (after build)
│   └── components/         # Component stylesheets
│       ├── header.css
│       ├── nav.css
│       ├── card.css
│       ├── form.css
│       ├── table.css
│       ├── modal.css
│       ├── toast.css
│       ├── button.css
│       └── chip.css
│
├── js/
│   ├── storage.js          # Data persistence layer
│   ├── main.js             # Module orchestrator
│   ├── bundle.js           # Concatenated (after build)
│   ├── bundle.min.js       # Minified (after build)
│   └── components/
│       ├── auth.js
│       ├── toast.js
│       ├── modal.js
│       ├── attendance.js
│       ├── assignments.js
│       ├── gradebook.js
│       ├── timetable.js
│       └── announcements.js
│
├── data/
│   ├── README.md           # Data field reference
│   └── sample/             # Sample JSON data files
│       ├── users.json
│       ├── classes.json
│       ├── enrollments.json
│       ├── assignments.json
│       ├── submissions.json
│       ├── attendance.json
│       ├── grades.json
│       ├── timetable.json
│       └── announcements.json
│
├── schemas/                # JSON Schema definitions
│   ├── users.schema.json
│   ├── classes.schema.json
│   └── ... (9 total)
│
├── scripts/
│   ├── build.ps1           # Windows build (minify CSS/JS)
│   ├── build.sh            # Linux build
│   ├── schema-check.js     # Node.js schema validator
│   ├── schema_check.py     # Python schema validator
│   ├── ui-smoke-test.js    # HTML structural tests
│   ├── csv-to-json.js      # CSV import converter
│   └── opusprompts/        # Claude Opus automation prompts
│       ├── master.prompt
│       ├── ui_scaffold.prompt
│       ├── theme_generator.prompt
│       ├── accessibility_audit.prompt
│       ├── attendance_report.prompt
│       └── pdf_report.prompt
│
├── server/
│   ├── app.py              # Flask backend
│   ├── README.md           # Server documentation
│   ├── SECURITY.md         # Security policy
│   ├── secrets.example.json
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── assets/
│   └── logo-placeholder.svg
│
├── docs/
│   ├── USAGE.md            # Usage guide and troubleshooting
│   ├── SCHEMA.md           # Data schema reference
│   ├── CODE_STYLE.md       # Coding conventions
│   └── OPUS_REGEN.md       # AI prompt regeneration guide
```

---

## Build (Minified Assets)

Requires Node.js 18+:

```powershell
# Windows
.\scripts\build.ps1

# Linux
bash scripts/build.sh

# Or via npm
npm install
npm run build
```

Produces:
- `css/styles.min.css` — minified stylesheet
- `js/bundle.js` — concatenated readable JS
- `js/bundle.min.js` — minified JS bundle

---

## Validation & Testing

### Schema Validation

```powershell
# Python (no extra deps)
python scripts/schema_check.py

# Node.js
node scripts/schema-check.js
```

### UI Smoke Tests

```powershell
node scripts/ui-smoke-test.js
```

### Full Test Suite

```powershell
npm test   # runs schema validation + smoke tests
```

---

## Importing Data

### From CSV (Schoolbox / Compass Export)

```powershell
node scripts/csv-to-json.js students_export.csv users data/sample/users.json
node scripts/csv-to-json.js attendance_report.csv attendance data/sample/attendance.json
```

Supported entities: `users`, `classes`, `enrollments`, `assignments`, `submissions`, `attendance`, `grades`, `timetable`, `announcements`

See [data/README.md](data/README.md) for field mappings.

---

## Opus Integration

Claude Opus prompts are provided in `scripts/opusprompts/` for common tasks:

| Prompt File              | Purpose                                    |
|--------------------------|-------------------------------------------|
| `master.prompt`          | Full project context for any modification |
| `ui_scaffold.prompt`     | Generate new page scaffolds               |
| `theme_generator.prompt` | Create new CSS themes                     |
| `accessibility_audit.prompt` | WCAG 2.1 AA compliance check          |
| `attendance_report.prompt`   | Generate attendance reports            |
| `pdf_report.prompt`      | Browser-print or server-side PDF reports  |

### Usage with Claude API (model: `claude-opus-4-6`)

```python
import anthropic

client = anthropic.Anthropic()
prompt = open("scripts/opusprompts/master.prompt").read()

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=[
        {"role": "user", "content": prompt + "\n\nAdd a parent portal page."}
    ]
)
print(message.content[0].text)
```

---

## Accessibility

- WCAG 2.1 AA baseline
- Skip-link on every page
- ARIA landmarks (`main`, `nav`, `banner`)
- ARIA attributes on interactive elements
- Focus management in modals
- Three themes including high-contrast
- Reduced motion support (`prefers-reduced-motion`)
- Keyboard-navigable throughout
- See [accessibility_notes.md](accessibility_notes.md) for details

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE) file.

---

## Roadmap

- [ ] Parent/guardian portal
- [ ] Calendar integration
- [ ] File attachment support for submissions
- [ ] Push notifications (PWA)
- [ ] Report card PDF generation
- [ ] API rate limiting
- [ ] Multi-language support (i18n)
- [ ] Real-time updates (WebSocket)
