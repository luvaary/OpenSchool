// Purpose: Data persistence helper - reads/writes JSON files in static mode via fetch + localStorage
/**
 * @module storage
 * Storage abstraction layer. In static mode, data is read from JSON files
 * under data/sample/ and transient changes are persisted to localStorage.
 * To switch to server API, replace fetch URLs with API endpoints.
 */

const STORAGE_PREFIX = 'openschool_';
const DATA_BASE = 'data/sample/';

/**
 * Load a JSON data file. Checks localStorage overlay first, then falls back to static file.
 * @param {string} name - Data file name without extension (e.g. 'users')
 * @returns {Promise<Array>} Parsed JSON array
 */
export async function loadData(name) {
  // Check localStorage overlay first (for demo edits)
  const cached = localStorage.getItem(`${STORAGE_PREFIX}${name}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem(`${STORAGE_PREFIX}${name}`);
    }
  }

  // Fetch from static JSON
  const basePath = getBasePath();
  const response = await fetch(`${basePath}${DATA_BASE}${name}.json`);
  if (!response.ok) {
    console.warn(`[storage] Failed to load ${name}.json: ${response.status}`);
    return [];
  }
  const data = await response.json();
  return data;
}

/**
 * Save data to localStorage overlay (static mode).
 * In server mode, this would POST to an API endpoint.
 * @param {string} name - Data collection name
 * @param {Array} data - Data to persist
 */
export function saveData(name, data) {
  localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(data));
}

/**
 * Get the current user session from localStorage.
 * @returns {object|null} Current user object or null
 */
export function getSession() {
  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}session`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Set user session.
 * @param {object} user - User object to store in session
 */
export function setSession(user) {
  sessionStorage.setItem(`${STORAGE_PREFIX}session`, JSON.stringify(user));
}

/**
 * Clear the current session.
 */
export function clearSession() {
  sessionStorage.removeItem(`${STORAGE_PREFIX}session`);
}

/**
 * Clear all localStorage overlays (reset demo data).
 */
export function resetAllData() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach(k => localStorage.removeItem(k));
}

/**
 * Generate a simple unique ID.
 * @param {string} prefix - ID prefix
 * @returns {string}
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Determine base path relative to current page (handles pages/ subdirectory).
 * @returns {string}
 */
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/pages/')) {
    return '../';
  }
  return '';
}

/**
 * Export data array as CSV and trigger download.
 * @param {Array<object>} data - Array of objects
 * @param {string} filename - Download filename
 * @param {string[]} [columns] - Optional column order; defaults to all keys
 */
export function exportCSV(data, filename, columns) {
  if (!data.length) return;
  const cols = columns || Object.keys(data[0]);
  const header = cols.join(',');
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c] ?? '';
      const str = String(val);
      // Escape CSV values containing commas, quotes, or newlines
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
