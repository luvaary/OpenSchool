#!/usr/bin/env node
/**
 * OpenSchool - JSON Schema Validator (Node.js)
 *
 * Validates every sample data file against its matching schema.
 * Requires: ajv (installed via npx or npm install ajv ajv-formats)
 *
 * Usage:
 *   node scripts/schema-check.js
 *   node scripts/schema-check.js --verbose
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

const SCHEMAS_DIR = join(ROOT, 'schemas');
const DATA_DIR    = join(ROOT, 'data', 'sample');
const verbose     = process.argv.includes('--verbose');

// ---- Lightweight validator (no external deps) ----
// Performs structural checks; for full JSON-Schema compliance use Ajv.

const TYPES = {
    string:  v => typeof v === 'string',
    number:  v => typeof v === 'number' && !Number.isNaN(v),
    integer: v => Number.isInteger(v),
    boolean: v => typeof v === 'boolean',
    array:   v => Array.isArray(v),
    object:  v => typeof v === 'object' && v !== null && !Array.isArray(v),
    null:    v => v === null,
};

function validateValue(value, schema, path = '$') {
    const errors = [];

    // type check
    if (schema.type) {
        const types = Array.isArray(schema.type) ? schema.type : [schema.type];
        const ok = types.some(t => TYPES[t]?.(value));
        if (!ok) {
            errors.push(`${path}: expected type ${schema.type}, got ${typeof value}`);
            return errors; // skip deeper checks
        }
    }

    // enum
    if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${path}: value "${value}" not in enum [${schema.enum.join(', ')}]`);
    }

    // required properties
    if (schema.type === 'object' && schema.required) {
        for (const key of schema.required) {
            if (!(key in value)) {
                errors.push(`${path}: missing required property "${key}"`);
            }
        }
    }

    // object properties
    if (schema.properties && typeof value === 'object' && value !== null) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (key in value) {
                errors.push(...validateValue(value[key], propSchema, `${path}.${key}`));
            }
        }
    }

    // array items
    if (schema.items && Array.isArray(value)) {
        value.forEach((item, i) => {
            errors.push(...validateValue(item, schema.items, `${path}[${i}]`));
        });
    }

    // minLength / maxLength
    if (typeof value === 'string') {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push(`${path}: string length ${value.length} < minLength ${schema.minLength}`);
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push(`${path}: string length ${value.length} > maxLength ${schema.maxLength}`);
        }
    }

    // minimum / maximum
    if (typeof value === 'number') {
        if (schema.minimum !== undefined && value < schema.minimum) {
            errors.push(`${path}: ${value} < minimum ${schema.minimum}`);
        }
        if (schema.maximum !== undefined && value > schema.maximum) {
            errors.push(`${path}: ${value} > maximum ${schema.maximum}`);
        }
    }

    return errors;
}

// ---- Main ----

console.log('\n=== OpenSchool Schema Validation ===\n');

if (!existsSync(SCHEMAS_DIR)) {
    console.error('[FAIL] schemas/ directory not found');
    process.exit(1);
}
if (!existsSync(DATA_DIR)) {
    console.error('[FAIL] data/sample/ directory not found');
    process.exit(1);
}

const schemaFiles = readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.schema.json'));
let totalErrors = 0;
let validated = 0;

for (const schemaFile of schemaFiles) {
    const entityName = schemaFile.replace('.schema.json', '');
    const dataFile = join(DATA_DIR, `${entityName}.json`);

    if (!existsSync(dataFile)) {
        console.log(`[SKIP] No sample data for ${entityName}`);
        continue;
    }

    const schema = JSON.parse(readFileSync(join(SCHEMAS_DIR, schemaFile), 'utf-8'));
    const data   = JSON.parse(readFileSync(dataFile, 'utf-8'));

    // Data files are arrays of records; schema describes one record
    const records = Array.isArray(data) ? data : [data];
    let fileErrors = 0;

    for (let i = 0; i < records.length; i++) {
        const errors = validateValue(records[i], schema, `${entityName}[${i}]`);
        if (errors.length > 0) {
            fileErrors += errors.length;
            if (verbose) {
                errors.forEach(e => console.log(`  [ERR] ${e}`));
            }
        }
    }

    if (fileErrors === 0) {
        console.log(`[PASS] ${entityName} (${records.length} records)`);
    } else {
        console.log(`[FAIL] ${entityName}  -  ${fileErrors} error(s)`);
        totalErrors += fileErrors;
    }
    validated++;
}

console.log(`\n${validated} files validated, ${totalErrors} total error(s)\n`);
process.exit(totalErrors > 0 ? 1 : 0);
