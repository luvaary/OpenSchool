#!/usr/bin/env node
/**
 * OpenSchool - UI Smoke Test
 *
 * Lightweight DOM checks ensuring every page has required structural elements.
 * Uses only Node.js builtins + basic HTML parsing (no Puppeteer needed).
 *
 * Usage:
 *   node scripts/ui-smoke-test.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

const PAGES = [
    { file: 'login.html',       requires: ['<form', 'type="password"', 'aria-label', '<button'] },
    { file: 'index.html',       requires: ['<nav', '<main', 'id="toast-container"', 'id="modal-overlay"', 'data-theme'] },
    { file: 'teacher.html',     requires: ['<nav', '<main', 'teacher'] },
    { file: 'student.html',     requires: ['<nav', '<main', 'student'] },
    { file: 'admin.html',       requires: ['<nav', '<main', 'admin'] },
    { file: 'pages/class.html', requires: ['<nav', '<main', 'class-roster'] },
];

const META_CHECKS = [
    { pattern: '<meta charset',         label: 'charset meta' },
    { pattern: 'viewport',              label: 'viewport meta' },
    { pattern: '<html',                 label: 'html element' },
    { pattern: 'lang=',                 label: 'lang attribute' },
    { pattern: '<title>',               label: 'title element' },
];

const A11Y_CHECKS = [
    { pattern: 'skip-link',             label: 'skip-link' },
    { pattern: 'role=',                 label: 'ARIA roles' },
    { pattern: 'aria-',                 label: 'ARIA attributes' },
];

console.log('\n=== OpenSchool UI Smoke Tests ===\n');

let totalPass = 0;
let totalFail = 0;

for (const page of PAGES) {
    const filePath = join(ROOT, page.file);
    if (!existsSync(filePath)) {
        console.log(`[SKIP] ${page.file}  -  file not found`);
        continue;
    }

    const html = readFileSync(filePath, 'utf-8');
    let pageFails = 0;
    const issues = [];

    // Required elements
    for (const req of page.requires) {
        if (!html.includes(req)) {
            issues.push(`missing: ${req}`);
            pageFails++;
        }
    }

    // Meta checks
    for (const check of META_CHECKS) {
        if (!html.includes(check.pattern)) {
            issues.push(`missing ${check.label}`);
            pageFails++;
        }
    }

    // A11y checks
    for (const check of A11Y_CHECKS) {
        if (!html.includes(check.pattern)) {
            issues.push(`a11y: missing ${check.label}`);
            pageFails++;
        }
    }

    // CSS link check
    if (!html.includes('styles.css') && !html.includes('styles.min.css')) {
        issues.push('no stylesheet link');
        pageFails++;
    }

    // JS module check (except login which has its own)
    if (page.file !== 'login.html') {
        if (!html.includes('main.js') && !html.includes('bundle.js') && !html.includes('bundle.min.js')) {
            issues.push('no JS entry point');
            pageFails++;
        }
    }

    if (pageFails === 0) {
        console.log(`[PASS] ${page.file}`);
        totalPass++;
    } else {
        console.log(`[FAIL] ${page.file}  -  ${pageFails} issue(s):`);
        issues.forEach(i => console.log(`       - ${i}`));
        totalFail++;
    }
}

// ---- Asset checks ----
console.log('\n--- Asset Checks ---\n');

const requiredAssets = [
    'css/styles.css',
    'css/tokens.css',
    'js/storage.js',
    'js/main.js',
    'js/components/auth.js',
    'js/components/toast.js',
    'js/components/modal.js',
    'js/components/attendance.js',
    'js/components/assignments.js',
    'js/components/gradebook.js',
    'js/components/timetable.js',
    'js/components/announcements.js',
    'data/sample/users.json',
    'assets/logo-placeholder.svg',
];

for (const asset of requiredAssets) {
    const p = join(ROOT, asset);
    if (existsSync(p)) {
        const size = readFileSync(p).length;
        console.log(`[OK]   ${asset} (${size} bytes)`);
    } else {
        console.log(`[MISS] ${asset}`);
        totalFail++;
    }
}

// ---- Sample data JSON parse check ----
console.log('\n--- JSON Parse Check ---\n');

const dataDir = join(ROOT, 'data', 'sample');
if (existsSync(dataDir)) {
    const { readdirSync } = await import('fs');
    const jsonFiles = readdirSync(dataDir).filter(f => f.endsWith('.json'));
    for (const jf of jsonFiles) {
        try {
            JSON.parse(readFileSync(join(dataDir, jf), 'utf-8'));
            console.log(`[OK]   data/sample/${jf}`);
        } catch (e) {
            console.log(`[FAIL] data/sample/${jf}: ${e.message}`);
            totalFail++;
        }
    }
}

// ---- Summary ----
console.log(`\n=== Summary: ${totalPass} pages passed, ${totalFail} issue(s) ===\n`);
process.exit(totalFail > 0 ? 1 : 0);
