# OpenSchool – Flask Server

Optional backend providing SQLite persistence, bcrypt auth, and CSRF protection.

## Quick Start

```powershell
# Windows (from project root)
cd server
python -m venv ..\\.venv
..\.venv\Scripts\Activate.ps1
pip install flask bcrypt

# Initialize database
python app.py --init-db --seed

# Start server
python app.py --port 8000
```

```bash
# Linux / macOS
cd server
python3 -m venv ../.venv
source ../.venv/bin/activate
pip install flask bcrypt

python app.py --init-db --seed
python app.py --port 8000
```

## API Endpoints

| Method | Path                    | Auth     | Description              |
|--------|-------------------------|----------|--------------------------|
| POST   | `/api/auth/login`       | No       | Login, returns user JSON  |
| POST   | `/api/auth/logout`      | Yes      | Clear session             |
| GET    | `/api/auth/me`          | Yes      | Current user info         |
| GET    | `/api/<entity>`         | Yes      | List all records          |
| GET    | `/api/<entity>/<id>`    | Yes      | Get single record         |
| POST   | `/api/<entity>`         | Yes      | Create record             |
| PUT    | `/api/<entity>/<id>`    | Yes      | Update record             |
| DELETE | `/api/<entity>/<id>`    | Admin    | Delete record             |

### Entities

`users`, `classes`, `enrollments`, `assignments`, `submissions`, `attendance`, `grades`, `timetable`, `announcements`

## CSRF Protection

All POST/PUT/DELETE requests require a `X-CSRF-Token` header matching the `csrf_token` cookie:

```javascript
fetch('/api/assignments', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.cookie.match(/csrf_token=([^;]+)/)?.[1] || '',
    },
    body: JSON.stringify({ ... }),
});
```

## Database

SQLite database stored at `server/openschool.db`. Migrations in `server/migrations/`.

- WAL mode enabled for concurrent reads
- Foreign keys enforced
- Indexes on commonly queried columns

## Security Notes

- Passwords hashed with bcrypt (cost factor 12)
- Session cookies: HttpOnly, SameSite=Lax
- CSRF double-submit cookie pattern
- Max request size: 2 MB
- No CORS headers (same-origin only)
- See `SECURITY.md` for full security policy
