#!/usr/bin/env node
/**
 * OpenSchool - CSV-to-JSON Converter
 *
 * Converts CSV exports (from Schoolbox, Compass, or generic SIS) into
 * OpenSchool-compatible JSON files.
 *
 * Usage:
 *   node scripts/csv-to-json.js <input.csv> <entity> [output.json]
 *
 * Entities: users, classes, enrollments, assignments, submissions,
 *           attendance, grades, timetable, announcements
 *
 * Example:
 *   node scripts/csv-to-json.js export_students.csv users data/sample/users.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---- CSV Parser (RFC 4180 compliant) ----

function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const chars = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        const next = chars[i + 1];

        if (inQuotes) {
            if (c === '"' && next === '"') {
                field += '"';
                i++; // skip escaped quote
            } else if (c === '"') {
                inQuotes = false;
            } else {
                field += c;
            }
        } else {
            if (c === '"') {
                inQuotes = true;
            } else if (c === ',') {
                row.push(field.trim());
                field = '';
            } else if (c === '\n') {
                row.push(field.trim());
                if (row.some(f => f !== '')) rows.push(row);
                row = [];
                field = '';
            } else {
                field += c;
            }
        }
    }
    // Last field
    row.push(field.trim());
    if (row.some(f => f !== '')) rows.push(row);

    return rows;
}

// ---- Field Mappings ----
// Maps common CSV column headers to OpenSchool field names.

const FIELD_MAPS = {
    users: {
        'student_id': 'id', 'teacher_id': 'id', 'user_id': 'id', 'id': 'id',
        'username': 'username', 'user_name': 'username', 'login': 'username',
        'display_name': 'display_name', 'name': 'display_name', 'full_name': 'display_name',
        'first_name': '_first_name', 'last_name': '_last_name',
        'email': 'email', 'email_address': 'email',
        'role': 'role', 'user_type': 'role', 'type': 'role',
        'year_level': 'year_level', 'grade_level': 'year_level', 'year': 'year_level',
    },
    classes: {
        'class_id': 'id', 'id': 'id', 'code': 'id',
        'class_name': 'name', 'name': 'name', 'subject': 'name',
        'teacher_id': 'teacher_id', 'teacher': 'teacher_id',
        'room': 'room', 'classroom': 'room',
        'year_level': 'year_level', 'grade': 'year_level',
    },
    enrollments: {
        'enrollment_id': 'id', 'id': 'id',
        'student_id': 'student_id', 'student': 'student_id',
        'class_id': 'class_id', 'class': 'class_id',
    },
    attendance: {
        'record_id': 'id', 'id': 'id',
        'class_id': 'class_id', 'class': 'class_id',
        'student_id': 'student_id', 'student': 'student_id',
        'date': 'date',
        'status': 'status', 'attendance_status': 'status',
        'marked_by': 'marked_by', 'teacher': 'marked_by',
    },
    assignments: {
        'assignment_id': 'id', 'id': 'id',
        'class_id': 'class_id', 'class': 'class_id',
        'title': 'title', 'name': 'title',
        'description': 'description', 'details': 'description',
        'due_date': 'due_date', 'due': 'due_date',
        'max_points': 'max_points', 'points': 'max_points', 'total_marks': 'max_points',
        'weight': 'weight',
        'status': 'status',
    },
    submissions: {
        'submission_id': 'id', 'id': 'id',
        'assignment_id': 'assignment_id',
        'student_id': 'student_id', 'student': 'student_id',
        'submitted_at': 'submitted_at', 'submission_date': 'submitted_at',
        'content': 'content', 'body': 'content', 'text': 'content',
        'status': 'status',
    },
    grades: {
        'grade_id': 'id', 'id': 'id',
        'assignment_id': 'assignment_id',
        'student_id': 'student_id', 'student': 'student_id',
        'points': 'points', 'score': 'points', 'mark': 'points',
        'letter': 'letter', 'grade': 'letter',
        'feedback': 'feedback', 'comment': 'feedback', 'comments': 'feedback',
    },
    timetable: {
        'slot_id': 'id', 'id': 'id',
        'class_id': 'class_id', 'class': 'class_id',
        'day': 'day', 'day_of_week': 'day',
        'start_time': 'start_time', 'start': 'start_time',
        'end_time': 'end_time', 'end': 'end_time',
        'room': 'room', 'location': 'room',
    },
    announcements: {
        'announcement_id': 'id', 'id': 'id',
        'title': 'title', 'subject': 'title',
        'body': 'body', 'content': 'body', 'message': 'body',
        'author_id': 'author_id', 'author': 'author_id',
        'priority': 'priority',
        'status': 'status',
    },
};

// ---- Conversion Logic ----

function convertCSV(rows, entity) {
    const fieldMap = FIELD_MAPS[entity];
    if (!fieldMap) {
        console.error(`Unknown entity: ${entity}`);
        console.error(`Available: ${Object.keys(FIELD_MAPS).join(', ')}`);
        process.exit(1);
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
    const records = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const record = {};
        let firstName = '', lastName = '';

        for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const mapped = fieldMap[header];
            if (!mapped) continue;

            let value = row[j] || '';

            // Handle internal mapping helpers
            if (mapped === '_first_name') { firstName = value; continue; }
            if (mapped === '_last_name')  { lastName = value; continue; }

            // Type coercion
            if (['max_points', 'points', 'weight', 'year_level'].includes(mapped)) {
                value = Number(value) || 0;
            }

            record[mapped] = value;
        }

        // Combine first + last name if display_name not present
        if (!record.display_name && (firstName || lastName)) {
            record.display_name = `${firstName} ${lastName}`.trim();
        }

        // Generate ID if missing
        if (!record.id) {
            record.id = `${entity.charAt(0)}-imported-${i}`;
        }

        records.push(record);
    }

    return records;
}

// ---- CLI ----

const args = process.argv.slice(2);

if (args.length < 2) {
    console.log(`
OpenSchool CSV-to-JSON Converter

Usage:
  node scripts/csv-to-json.js <input.csv> <entity> [output.json]

Entities:
  ${Object.keys(FIELD_MAPS).join(', ')}

Examples:
  node scripts/csv-to-json.js students.csv users data/sample/users.json
  node scripts/csv-to-json.js compass_attendance.csv attendance
`);
    process.exit(0);
}

const [inputFile, entity, outputFile] = args;

if (!existsSync(inputFile)) {
    console.error(`[FAIL] File not found: ${inputFile}`);
    process.exit(1);
}

console.log(`\nConverting ${inputFile} -> ${entity}`);

const csvText = readFileSync(inputFile, 'utf-8');
const rows = parseCSV(csvText);
console.log(`  Parsed ${rows.length - 1} data rows (${rows[0].length} columns)`);

const records = convertCSV(rows, entity);
console.log(`  Converted ${records.length} records`);

const output = outputFile || resolve(ROOT, 'data', 'sample', `${entity}.json`);
const json = JSON.stringify(records, null, 2);
writeFileSync(output, json, 'utf-8');
console.log(`  Written to ${output}\n`);
