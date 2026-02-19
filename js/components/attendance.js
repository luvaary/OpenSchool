// Purpose: Attendance module - roster display, quick toggle, history, CSV export
/**
 * @module attendance
 * Handles attendance taking, history viewing, and CSV export.
 */

import { loadData, saveData, generateId, exportCSV } from '../storage.js';
import { showToast } from './toast.js';

let attendanceData = [];
let classesData = [];
let enrollmentsData = [];
let usersData = [];

/**
 * Initialize attendance module.
 * @param {object} user - Current logged-in user
 */
export async function init(user) {
  [attendanceData, classesData, enrollmentsData, usersData] = await Promise.all([
    loadData('attendance'),
    loadData('classes'),
    loadData('enrollments'),
    loadData('users')
  ]);

  const classSelect = document.getElementById('attendance-class-select');
  const dateInput = document.getElementById('attendance-date');

  if (classSelect) {
    // Populate class dropdown (filter by teacher if teacher role)
    const classes = user.role === 'teacher'
      ? classesData.filter(c => c.teacher_id === user.id)
      : classesData;

    classSelect.innerHTML = '<option value="">Select class…</option>';
    classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      classSelect.appendChild(opt);
    });

    classSelect.addEventListener('change', () => renderRoster(classSelect.value, dateInput?.value, user));
  }

  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
    dateInput.addEventListener('change', () => renderRoster(classSelect?.value, dateInput.value, user));
  }

  // Export button
  const exportBtn = document.getElementById('attendance-export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportAttendanceCSV(classSelect?.value));
  }
}

/**
 * Render the attendance roster for a given class and date.
 * @param {string} classId
 * @param {string} date - YYYY-MM-DD
 * @param {object} user
 */
function renderRoster(classId, date, user) {
  const container = document.getElementById('attendance-roster');
  if (!container || !classId) {
    if (container) container.innerHTML = '<p class="text-muted">Select a class to take attendance.</p>';
    return;
  }

  const students = getClassStudents(classId);
  if (!students.length) {
    container.innerHTML = '<p class="text-muted">No students enrolled in this class.</p>';
    return;
  }

  // Reload attendance data to get latest
  const todayRecords = attendanceData.filter(a => a.class_id === classId && a.date === date);

  let html = '<div class="table-wrapper"><table class="data-table" aria-label="Attendance roster">';
  html += '<thead><tr><th>Student</th><th>Status</th></tr></thead><tbody>';

  students.forEach(s => {
    const existing = todayRecords.find(r => r.student_id === s.id);
    const status = existing?.status || '';
    html += `
      <tr>
        <td>${escapeHtml(s.display_name)}</td>
        <td>
          <div class="attendance-toggle" role="group" aria-label="Attendance for ${escapeHtml(s.display_name)}">
            ${['present', 'absent', 'late', 'excused'].map(st => `
              <button type="button"
                class="attendance-toggle__btn attendance-toggle__btn--${st}"
                data-student="${s.id}" data-status="${st}"
                aria-pressed="${status === st}"
                aria-label="${st}">
                ${st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            `).join('')}
          </div>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  html += `<div class="mt-4"><button class="btn btn--primary" id="save-roster-attendance">Save Attendance</button></div>`;
  container.innerHTML = html;

  // Bind toggle buttons
  container.querySelectorAll('.attendance-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.attendance-toggle');
      group.querySelectorAll('.attendance-toggle__btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
    });
  });

  // Save button
  const saveBtn = document.getElementById('save-roster-attendance');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveAttendance(classId, date, user));
  }

  // Render history
  renderHistory(classId);
}

/**
 * Save attendance records from the current roster state.
 * @param {string} classId
 * @param {string} date
 * @param {object} user
 */
function saveAttendance(classId, date, user) {
  const container = document.getElementById('attendance-roster');
  if (!container) return;

  const toggles = container.querySelectorAll('.attendance-toggle');
  const now = new Date().toISOString();
  let count = 0;

  toggles.forEach(group => {
    const pressed = group.querySelector('[aria-pressed="true"]');
    if (!pressed) return;

    const studentId = pressed.dataset.student;
    const status = pressed.dataset.status;

    // Update or create record
    const existingIdx = attendanceData.findIndex(
      a => a.class_id === classId && a.student_id === studentId && a.date === date
    );

    const record = {
      id: existingIdx >= 0 ? attendanceData[existingIdx].id : generateId('att'),
      class_id: classId,
      student_id: studentId,
      date,
      status,
      recorded_by: user.id,
      recorded_at: now,
      note: null
    };

    if (existingIdx >= 0) {
      attendanceData[existingIdx] = record;
    } else {
      attendanceData.push(record);
    }
    count++;
  });

  saveData('attendance', attendanceData);
  showToast(`Saved attendance for ${count} student(s).`, 'success');
  renderHistory(classId);
}

/**
 * Render attendance history table for a class.
 * @param {string} classId
 */
function renderHistory(classId) {
  const container = document.getElementById('attendance-history-table');
  if (!container) return;

  const records = attendanceData
    .filter(a => a.class_id === classId)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!records.length) {
    container.innerHTML = '<p class="text-muted">No attendance history for this class.</p>';
    return;
  }

  let html = '<table class="data-table data-table--striped" aria-label="Attendance history">';
  html += '<thead><tr><th>Date</th><th>Student</th><th>Status</th><th>Note</th></tr></thead><tbody>';

  records.slice(0, 50).forEach(r => {
    const student = usersData.find(u => u.id === r.student_id);
    const chipClass = `chip--${r.status}`;
    html += `
      <tr>
        <td>${r.date}</td>
        <td>${escapeHtml(student?.display_name || r.student_id)}</td>
        <td><span class="chip ${chipClass}">${r.status}</span></td>
        <td>${escapeHtml(r.note || '—')}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/**
 * Export attendance data as CSV.
 * @param {string} [classId] - Optional class filter
 */
function exportAttendanceCSV(classId) {
  let records = attendanceData;
  if (classId) {
    records = records.filter(a => a.class_id === classId);
  }
  if (!records.length) {
    showToast('No attendance records to export.', 'warning');
    return;
  }
  exportCSV(records, 'attendance_export.csv', ['date', 'class_id', 'student_id', 'status', 'note']);
  showToast('Attendance CSV exported.', 'success');
}

/**
 * Get students enrolled in a class.
 * @param {string} classId
 * @returns {Array<object>}
 */
function getClassStudents(classId) {
  const studentIds = enrollmentsData
    .filter(e => e.class_id === classId && e.status === 'active')
    .map(e => e.student_id);
  return usersData.filter(u => studentIds.includes(u.id));
}

/**
 * Get attendance summary stats for a class.
 * @param {string} classId
 * @returns {{ present: number, absent: number, late: number, excused: number, total: number }}
 */
export function getClassAttendanceSummary(classId) {
  const records = attendanceData.filter(a => a.class_id === classId);
  return {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    excused: records.filter(r => r.status === 'excused').length,
    total: records.length
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function destroy() {}
