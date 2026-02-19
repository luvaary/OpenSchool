#!/usr/bin/env python3
"""
OpenSchool – Flask Server (Optional Backend)

Provides:
  - SQLite persistence (replaces JSON flat files)
  - bcrypt password hashing
  - CSRF protection via double-submit cookie
  - RESTful JSON API for all entities
  - Static file serving for the frontend

Usage:
    python server/app.py                 # development mode
    python server/app.py --port 5000     # custom port
    python server/app.py --init-db       # initialize database

Requires: flask>=3.0, bcrypt>=4.1
"""

from __future__ import annotations

import argparse
import json
import os
import secrets
import sqlite3
import sys
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path

import bcrypt
from flask import (
    Flask,
    Request,
    Response,
    g,
    jsonify,
    redirect,
    request,
    send_from_directory,
    session,
    url_for,
)

# ── Configuration ─────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
SECRETS_FILE = ROOT / "server" / "secrets.json"
DB_PATH = ROOT / "server" / "openschool.db"
MIGRATIONS_DIR = ROOT / "server" / "migrations"

app = Flask(
    __name__,
    static_folder=str(ROOT),
    static_url_path="",
)

# Load or generate secret key
if SECRETS_FILE.exists():
    _secrets = json.loads(SECRETS_FILE.read_text())
    app.secret_key = _secrets.get("flask_secret", secrets.token_hex(32))
else:
    app.secret_key = secrets.token_hex(32)
    print(f"[WARN] No secrets.json found. Using ephemeral secret key.")

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=3600,  # 1 hour
    MAX_CONTENT_LENGTH=2 * 1024 * 1024,  # 2 MB
)


# ── Database ──────────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(str(DB_PATH))
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Run all migration SQL files in order."""
    db = sqlite3.connect(str(DB_PATH))
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA foreign_keys=ON")

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    for mf in migration_files:
        print(f"  Running migration: {mf.name}")
        sql = mf.read_text(encoding="utf-8")
        db.executescript(sql)

    db.commit()
    db.close()
    print(f"[OK] Database initialized at {DB_PATH}")


def seed_db():
    """Load sample data from JSON files into the database."""
    db = sqlite3.connect(str(DB_PATH))
    db.row_factory = sqlite3.Row
    sample_dir = ROOT / "data" / "sample"

    # Users (hash passwords)
    users = json.loads((sample_dir / "users.json").read_text())
    for u in users:
        pw_hash = bcrypt.hashpw(u["password_hash"].encode(), bcrypt.gensalt()).decode()
        db.execute(
            "INSERT OR IGNORE INTO users (id, username, password_hash, display_name, email, role, year_level) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (u["id"], u["username"], pw_hash, u["display_name"], u["email"], u["role"], u.get("year_level")),
        )

    # Simple table inserts
    table_map = {
        "classes": ("classes", ["id", "name", "teacher_id", "room", "year_level"]),
        "enrollments": ("enrollments", ["id", "student_id", "class_id"]),
        "assignments": ("assignments", ["id", "class_id", "title", "description", "due_date", "max_points", "weight", "status", "created_by"]),
        "submissions": ("submissions", ["id", "assignment_id", "student_id", "submitted_at", "content", "file_name", "status"]),
        "attendance": ("attendance", ["id", "class_id", "student_id", "date", "status", "marked_by", "note"]),
        "grades": ("grades", ["id", "assignment_id", "student_id", "points", "letter", "feedback", "graded_by", "graded_at"]),
        "timetable": ("timetable", ["id", "class_id", "day", "start_time", "end_time", "room"]),
        "announcements": ("announcements", ["id", "title", "body", "author_id", "priority", "status", "created_at"]),
    }

    for filename, (table, cols) in table_map.items():
        data_file = sample_dir / f"{filename}.json"
        if not data_file.exists():
            continue
        records = json.loads(data_file.read_text())
        placeholders = ", ".join("?" * len(cols))
        col_names = ", ".join(cols)
        for r in records:
            values = [r.get(c) for c in cols]
            # Handle list fields (visible_to in announcements)
            values = [json.dumps(v) if isinstance(v, list) else v for v in values]
            try:
                db.execute(f"INSERT OR IGNORE INTO {table} ({col_names}) VALUES ({placeholders})", values)
            except sqlite3.Error as e:
                print(f"  [WARN] {table}: {e}")

    db.commit()
    db.close()
    print("[OK] Sample data seeded")


# ── CSRF Protection ──────────────────────────────────────────────────────────

@app.before_request
def csrf_protect():
    """Double-submit cookie CSRF protection for state-changing methods."""
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        token_cookie = request.cookies.get("csrf_token", "")
        token_header = request.headers.get("X-CSRF-Token", "")
        if not token_cookie or token_cookie != token_header:
            return jsonify({"error": "CSRF token mismatch"}), 403


@app.after_request
def set_csrf_cookie(response: Response) -> Response:
    if "csrf_token" not in request.cookies:
        token = secrets.token_hex(32)
        response.set_cookie("csrf_token", token, httponly=False, samesite="Lax")
    return response


# ── Auth Helpers ──────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"error": "Authentication required"}), 401
            if session.get("role") not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# ── Auth Routes ───────────────────────────────────────────────────────────────

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    session.permanent = True
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["role"] = user["role"]

    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "display_name": user["display_name"],
        "role": user["role"],
    })


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@app.route("/api/auth/me")
@login_required
def api_me():
    db = get_db()
    user = db.execute("SELECT id, username, display_name, email, role, year_level FROM users WHERE id = ?",
                       (session["user_id"],)).fetchone()
    if not user:
        session.clear()
        return jsonify({"error": "User not found"}), 404
    return jsonify(dict(user))


# ── CRUD Routes ───────────────────────────────────────────────────────────────

ENTITY_TABLES = {
    "users": "users",
    "classes": "classes",
    "enrollments": "enrollments",
    "assignments": "assignments",
    "submissions": "submissions",
    "attendance": "attendance",
    "grades": "grades",
    "timetable": "timetable",
    "announcements": "announcements",
}


@app.route("/api/<entity>")
@login_required
def api_list(entity):
    if entity not in ENTITY_TABLES:
        return jsonify({"error": f"Unknown entity: {entity}"}), 404

    db = get_db()
    table = ENTITY_TABLES[entity]
    rows = db.execute(f"SELECT * FROM {table}").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/<entity>/<item_id>")
@login_required
def api_get(entity, item_id):
    if entity not in ENTITY_TABLES:
        return jsonify({"error": f"Unknown entity: {entity}"}), 404

    db = get_db()
    table = ENTITY_TABLES[entity]
    row = db.execute(f"SELECT * FROM {table} WHERE id = ?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(dict(row))


@app.route("/api/<entity>", methods=["POST"])
@login_required
def api_create(entity):
    if entity not in ENTITY_TABLES:
        return jsonify({"error": f"Unknown entity: {entity}"}), 404

    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({"error": "No data provided"}), 400

    db = get_db()
    table = ENTITY_TABLES[entity]

    cols = list(data.keys())
    vals = [json.dumps(v) if isinstance(v, (list, dict)) else v for v in data.values()]
    placeholders = ", ".join("?" * len(cols))
    col_str = ", ".join(cols)

    try:
        db.execute(f"INSERT INTO {table} ({col_str}) VALUES ({placeholders})", vals)
        db.commit()
        return jsonify({"message": "Created", "id": data.get("id")}), 201
    except sqlite3.IntegrityError as e:
        return jsonify({"error": str(e)}), 409
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/<entity>/<item_id>", methods=["PUT"])
@login_required
def api_update(entity, item_id):
    if entity not in ENTITY_TABLES:
        return jsonify({"error": f"Unknown entity: {entity}"}), 404

    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({"error": "No data provided"}), 400

    db = get_db()
    table = ENTITY_TABLES[entity]

    set_clause = ", ".join(f"{k} = ?" for k in data.keys())
    vals = [json.dumps(v) if isinstance(v, (list, dict)) else v for v in data.values()]
    vals.append(item_id)

    try:
        result = db.execute(f"UPDATE {table} SET {set_clause} WHERE id = ?", vals)
        db.commit()
        if result.rowcount == 0:
            return jsonify({"error": "Not found"}), 404
        return jsonify({"message": "Updated"})
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/<entity>/<item_id>", methods=["DELETE"])
@login_required
@role_required("admin")
def api_delete(entity, item_id):
    if entity not in ENTITY_TABLES:
        return jsonify({"error": f"Unknown entity: {entity}"}), 404

    db = get_db()
    table = ENTITY_TABLES[entity]
    result = db.execute(f"DELETE FROM {table} WHERE id = ?", (item_id,))
    db.commit()

    if result.rowcount == 0:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": "Deleted"})


# ── Static File Serving ──────────────────────────────────────────────────────

@app.route("/")
def serve_index():
    return send_from_directory(str(ROOT), "login.html")


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(str(ROOT), filename)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="OpenSchool Flask Server")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--init-db", action="store_true", help="Initialize the database")
    parser.add_argument("--seed", action="store_true", help="Seed database with sample data")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    args = parser.parse_args()

    if args.init_db:
        print("\n[INIT] Initializing database...")
        init_db()
        if args.seed:
            print("[SEED] Loading sample data...")
            seed_db()
        return

    if args.seed:
        print("[SEED] Loading sample data...")
        seed_db()
        return

    print(f"\n{'='*50}")
    print(f"  OpenSchool Flask Server")
    print(f"  http://{args.host}:{args.port}")
    print(f"  Database: {DB_PATH}")
    print(f"{'='*50}\n")

    app.run(host=args.host, port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()
