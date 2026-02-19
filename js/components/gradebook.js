// Purpose: Gradebook module - grade input, weighted average calculation, CSV export
/**
 * @module gradebook
 * Displays grades per class, calculates weighted averages, supports CSV export/import.
 */

import { loadData, saveData, exportCSV } from '../storage.js';
import { showToast } from './toast.js';

let gradesData = [];
let assignmentsData = [];
let classesData = [];
let enrollmentsData = [];
let usersData = [];

/**
 * Initialize gradebook module.
 * @param {object} user - Current logged-in user
 */
export async function init(user) {
  [gradesData, assignmentsData, classesData, enrollmentsData, usersData] = await Promise.all([
    loadData('grades'),
    loadData('assignments'),
    loadData('classes'),
    loadData('enrollments'),
    loadData('users')
  ]);

  if (user.role === 'teacher' || user.role === 'admin') {
    setupTeacherGradebook(user);
  } else if (user.role === 'student') {
    renderStudentGrades(user);
  }
}

/**
 * Set up the teacher gradebook view with class selector.
 * @param {object} user
 */
function setupTeacherGradebook(user) {
  const classSelect = document.getElementById('gradebook-class-select');
  if (!classSelect) return;

  const classes = user.role === 'admin'
    ? classesData
    : classesData.filter(c => c.teacher_id === user.id);

  classSelect.innerHTML = '<option value="">Select class…</option>';
  classes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    classSelect.appendChild(opt);
  });

  classSelect.addEventListener('change', () => renderClassGradebook(classSelect.value));

  // Export button
  const exportBtn = document.getElementById('gradebook-export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportGradesCSV(classSelect.value));
  }
}

/**
 * Render gradebook for a specific class (teacher/admin view).
 * @param {string} classId
 */
function renderClassGradebook(classId) {
  const container = document.getElementById('gradebook-content');
  if (!container || !classId) {
    if (container) container.innerHTML = '<p class="text-muted">Select a class to view grades.</p>';
    return;
  }

  const students = getClassStudents(classId);
  const classAssignments = assignmentsData.filter(a => a.class_id === classId && a.status !== 'draft');

  if (!students.length) {
    container.innerHTML = '<p class="text-muted">No students enrolled.</p>';
    return;
  }

  let html = '<div class="table-wrapper"><table class="data-table" aria-label="Gradebook">';
  html += '<thead><tr><th>Student</th>';
  classAssignments.forEach(a => {
    html += `<th title="${escapeHtml(a.title)}">${escapeHtml(a.title.substring(0, 15))}${a.title.length > 15 ? '…' : ''}</th>`;
  });
  html += '<th>Weighted Avg</th><th>Letter</th></tr></thead><tbody>';

  students.forEach(s => {
    html += `<tr><td><strong>${escapeHtml(s.display_name)}</strong></td>`;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    classAssignments.forEach(a => {
      const grade = gradesData.find(g => g.student_id === s.id && g.assignment_id === a.id);
      if (grade) {
        const pct = (grade.points / grade.max_points * 100).toFixed(0);
        html += `<td>${grade.points}/${grade.max_points} <span class="text-sm text-muted">(${pct}%)</span></td>`;
        totalWeightedScore += (grade.points / grade.max_points) * (grade.weight || a.weight || 0.25);
        totalWeight += (grade.weight || a.weight || 0.25);
      } else {
        html += '<td class="text-muted">—</td>';
      }
    });

    const weightedAvg = totalWeight > 0 ? (totalWeightedScore / totalWeight * 100).toFixed(1) : '—';
    const letterGrade = totalWeight > 0 ? getLetterGrade(parseFloat(weightedAvg)) : '—';

    html += `<td><strong>${weightedAvg}${weightedAvg !== '—' ? '%' : ''}</strong></td>`;
    html += `<td><span class="chip chip--neutral">${letterGrade}</span></td>`;
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

/**
 * Render student's own grades view.
 * @param {object} user
 */
function renderStudentGrades(user) {
  const container = document.getElementById('gradebook-content') || document.getElementById('student-grades');
  if (!container) return;

  const myClassIds = enrollmentsData
    .filter(e => e.student_id === user.id && e.status === 'active')
    .map(e => e.class_id);

  const myGrades = gradesData.filter(g => g.student_id === user.id);

  if (!myGrades.length) {
    container.innerHTML = '<p class="text-muted">No grades recorded yet.</p>';
    return;
  }

  let html = '';
  myClassIds.forEach(classId => {
    const cls = classesData.find(c => c.id === classId);
    if (!cls) return;

    const classGrades = myGrades.filter(g => g.class_id === classId);
    if (!classGrades.length) return;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    html += `<div class="mb-4"><h3 style="margin:0 0 var(--space-2);">${escapeHtml(cls.name)}</h3>`;
    html += '<div class="table-wrapper"><table class="data-table" aria-label="Grades for ' + escapeHtml(cls.name) + '">';
    html += '<thead><tr><th>Assignment</th><th>Score</th><th>Percentage</th><th>Grade</th><th>Comments</th></tr></thead><tbody>';

    classGrades.forEach(g => {
      const assignment = assignmentsData.find(a => a.id === g.assignment_id);
      const pct = (g.points / g.max_points * 100).toFixed(0);
      totalWeightedScore += (g.points / g.max_points) * g.weight;
      totalWeight += g.weight;

      html += `
        <tr>
          <td>${escapeHtml(assignment?.title || g.assignment_id)}</td>
          <td>${g.points}/${g.max_points}</td>
          <td>${pct}%</td>
          <td><span class="chip chip--neutral">${g.letter_grade || '—'}</span></td>
          <td class="text-sm">${escapeHtml(g.comments || '—')}</td>
        </tr>
      `;
    });

    const avg = totalWeight > 0 ? (totalWeightedScore / totalWeight * 100).toFixed(1) : '—';
    html += `<tr style="font-weight:600;"><td>Weighted Average</td><td colspan="4">${avg}${avg !== '—' ? '%' : ''}</td></tr>`;
    html += '</tbody></table></div></div>';
  });

  container.innerHTML = html;
}

/**
 * Export grades as CSV.
 * @param {string} [classId]
 */
function exportGradesCSV(classId) {
  let data = gradesData;
  if (classId) data = data.filter(g => g.class_id === classId);

  if (!data.length) {
    showToast('No grades to export.', 'warning');
    return;
  }

  exportCSV(data, 'grades_export.csv', [
    'id', 'student_id', 'class_id', 'assignment_id', 'points', 'max_points', 'letter_grade'
  ]);
  showToast('Grades CSV exported.', 'success');
}

function getClassStudents(classId) {
  const studentIds = enrollmentsData
    .filter(e => e.class_id === classId && e.status === 'active')
    .map(e => e.student_id);
  return usersData.filter(u => studentIds.includes(u.id));
}

function getLetterGrade(pct) {
  if (pct >= 97) return 'A+';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function destroy() {}
