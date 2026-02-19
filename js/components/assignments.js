// Purpose: Assignments module - create, view, submit, grade assignments
/**
 * @module assignments
 * Teacher: create/edit assignments, view submissions, grade with modal.
 * Student: view assignments, submit work.
 */

import { loadData, saveData, generateId, exportCSV } from '../storage.js';
import { showToast } from './toast.js';
import { openModal, closeModal } from './modal.js';

let assignmentsData = [];
let submissionsData = [];
let classesData = [];
let enrollmentsData = [];
let usersData = [];

/**
 * Initialize assignments module.
 * @param {object} user - Current logged-in user
 */
export async function init(user) {
  [assignmentsData, submissionsData, classesData, enrollmentsData, usersData] = await Promise.all([
    loadData('assignments'),
    loadData('submissions'),
    loadData('classes'),
    loadData('enrollments'),
    loadData('users')
  ]);

  if (user.role === 'teacher' || user.role === 'admin') {
    renderTeacherAssignments(user);
    bindCreateButton(user);
  } else if (user.role === 'student') {
    renderStudentAssignments(user);
  }
}

/**
 * Render assignments list for teachers.
 * @param {object} user
 */
function renderTeacherAssignments(user) {
  const container = document.getElementById('assignments-list');
  if (!container) return;

  const newBtn = document.getElementById('new-assignment-btn');
  if (newBtn) newBtn.classList.remove('hidden');

  const myClasses = user.role === 'admin'
    ? classesData
    : classesData.filter(c => c.teacher_id === user.id);
  const myClassIds = myClasses.map(c => c.id);
  const myAssignments = assignmentsData.filter(a => myClassIds.includes(a.class_id));

  if (!myAssignments.length) {
    container.innerHTML = '<p class="text-muted">No assignments yet. Create one to get started.</p>';
    return;
  }

  let html = '<div class="table-wrapper"><table class="data-table" aria-label="Assignments">';
  html += '<thead><tr><th>Title</th><th>Class</th><th>Due</th><th>Max Pts</th><th>Status</th><th>Submissions</th><th>Actions</th></tr></thead><tbody>';

  myAssignments.forEach(a => {
    const cls = classesData.find(c => c.id === a.class_id);
    const subs = submissionsData.filter(s => s.assignment_id === a.id);
    const ungraded = subs.filter(s => s.status === 'submitted').length;
    const dueDate = new Date(a.due_date).toLocaleDateString();
    const chipClass = a.status === 'published' ? 'chip--published' : a.status === 'closed' ? 'chip--closed' : 'chip--draft';

    html += `
      <tr>
        <td><strong>${escapeHtml(a.title)}</strong></td>
        <td>${escapeHtml(cls?.name || a.class_id)}</td>
        <td>${dueDate}</td>
        <td>${a.max_points}</td>
        <td><span class="chip ${chipClass}">${a.status}</span></td>
        <td>${subs.length} ${ungraded ? `(${ungraded} ungraded)` : ''}</td>
        <td>
          <button class="btn btn--ghost btn--sm view-subs-btn" data-id="${a.id}" aria-label="View submissions for ${escapeHtml(a.title)}">
            View
          </button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;

  // Bind view submissions buttons
  container.querySelectorAll('.view-subs-btn').forEach(btn => {
    btn.addEventListener('click', () => showSubmissions(btn.dataset.id, user));
  });
}

/**
 * Render assignments list for students.
 * @param {object} user
 */
function renderStudentAssignments(user) {
  const container = document.getElementById('assignments-list') || document.getElementById('student-assignments');
  if (!container) return;

  const myClassIds = enrollmentsData
    .filter(e => e.student_id === user.id && e.status === 'active')
    .map(e => e.class_id);

  const myAssignments = assignmentsData
    .filter(a => myClassIds.includes(a.class_id) && a.status === 'published')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  if (!myAssignments.length) {
    container.innerHTML = '<p class="text-muted">No assignments right now.</p>';
    return;
  }

  let html = '';
  myAssignments.forEach(a => {
    const cls = classesData.find(c => c.id === a.class_id);
    const sub = submissionsData.find(s => s.assignment_id === a.id && s.student_id === user.id);
    const dueDate = new Date(a.due_date);
    const isOverdue = !sub && dueDate < new Date();
    const statusText = sub ? (sub.status === 'graded' ? `Graded: ${sub.grade}/${a.max_points}` : 'Submitted') : (isOverdue ? 'Overdue' : 'Not submitted');
    const statusChip = sub?.status === 'graded' ? 'chip--success' : sub ? 'chip--info' : isOverdue ? 'chip--danger' : 'chip--warning';

    html += `
      <div class="card mb-4" style="border-left: 4px solid ${cls?.color || 'var(--color-border)'}">
        <div class="card__body">
          <div class="flex justify-between items-center gap-3" style="flex-wrap:wrap;">
            <div>
              <h3 style="margin:0;">${escapeHtml(a.title)}</h3>
              <p class="text-sm text-muted mt-2">${escapeHtml(cls?.name || '')} · Due: ${dueDate.toLocaleDateString()}</p>
              <p class="text-sm mt-2">${escapeHtml(a.description || '')}</p>
            </div>
            <div class="flex flex-col items-center gap-2">
              <span class="chip ${statusChip}">${statusText}</span>
              ${!sub ? `<button class="btn btn--primary btn--sm submit-btn" data-id="${a.id}" aria-label="Submit ${escapeHtml(a.title)}">Submit</button>` : ''}
              ${sub?.status === 'graded' ? `<p class="text-sm"><strong>Feedback:</strong> ${escapeHtml(sub.feedback || 'None')}</p>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind submit buttons
  container.querySelectorAll('.submit-btn').forEach(btn => {
    btn.addEventListener('click', () => showSubmitModal(btn.dataset.id, user));
  });
}

/**
 * Bind the create assignment button.
 * @param {object} user
 */
function bindCreateButton(user) {
  const btn = document.getElementById('new-assignment-btn');
  if (btn) {
    btn.addEventListener('click', () => showCreateModal(user));
  }
}

/**
 * Show the create assignment modal.
 * @param {object} user
 */
function showCreateModal(user) {
  const myClasses = classesData.filter(c => c.teacher_id === user.id);
  const classOptions = myClasses.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

  const body = `
    <form id="create-assignment-form">
      <div class="form-group">
        <label for="asgn-class" class="form-label form-label--required">Class</label>
        <select id="asgn-class" class="form-select" required>${classOptions}</select>
      </div>
      <div class="form-group">
        <label for="asgn-title" class="form-label form-label--required">Title</label>
        <input id="asgn-title" class="form-input" required maxlength="200">
      </div>
      <div class="form-group">
        <label for="asgn-desc" class="form-label">Description</label>
        <textarea id="asgn-desc" class="form-textarea"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="asgn-due" class="form-label form-label--required">Due Date</label>
          <input id="asgn-due" type="datetime-local" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="asgn-points" class="form-label form-label--required">Max Points</label>
          <input id="asgn-points" type="number" class="form-input" min="0" value="100" required>
        </div>
      </div>
      <div class="form-group">
        <label for="asgn-weight" class="form-label">Weight (0–1)</label>
        <input id="asgn-weight" type="number" class="form-input" min="0" max="1" step="0.05" value="0.25">
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
    <button class="btn btn--primary" id="modal-save">Create Assignment</button>
  `;

  openModal('Create Assignment', body, footer);

  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-save')?.addEventListener('click', () => {
    const form = document.getElementById('create-assignment-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const assignment = {
      id: generateId('a'),
      class_id: document.getElementById('asgn-class').value,
      title: document.getElementById('asgn-title').value.trim(),
      description: document.getElementById('asgn-desc').value.trim(),
      created_by: user.id,
      created_at: new Date().toISOString(),
      due_date: new Date(document.getElementById('asgn-due').value).toISOString(),
      max_points: Number(document.getElementById('asgn-points').value),
      weight: Number(document.getElementById('asgn-weight').value),
      resources: [],
      status: 'published'
    };

    assignmentsData.push(assignment);
    saveData('assignments', assignmentsData);
    closeModal();
    showToast('Assignment created!', 'success');
    renderTeacherAssignments(user);
  });
}

/**
 * Show student submission modal.
 * @param {string} assignmentId
 * @param {object} user
 */
function showSubmitModal(assignmentId, user) {
  const assignment = assignmentsData.find(a => a.id === assignmentId);
  if (!assignment) return;

  const body = `
    <form id="submit-form">
      <p><strong>${escapeHtml(assignment.title)}</strong></p>
      <p class="text-sm text-muted">${escapeHtml(assignment.description || '')}</p>
      <div class="form-group mt-4">
        <label for="sub-content" class="form-label form-label--required">Your Submission</label>
        <textarea id="sub-content" class="form-textarea" required placeholder="Enter your response here…" rows="6"></textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
    <button class="btn btn--primary" id="modal-submit">Submit</button>
  `;

  openModal('Submit Assignment', body, footer);

  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-submit')?.addEventListener('click', () => {
    const content = document.getElementById('sub-content')?.value.trim();
    if (!content) { showToast('Please enter your submission.', 'warning'); return; }

    const submission = {
      id: generateId('sub'),
      assignment_id: assignmentId,
      student_id: user.id,
      submitted_at: new Date().toISOString(),
      content,
      file_path: null,
      grade: null,
      feedback: null,
      graded_at: null,
      status: 'submitted'
    };

    submissionsData.push(submission);
    saveData('submissions', submissionsData);
    closeModal();
    showToast('Submission received!', 'success');
    renderStudentAssignments(user);
  });
}

/**
 * Show submissions for a given assignment (teacher view).
 * @param {string} assignmentId
 * @param {object} user
 */
function showSubmissions(assignmentId, user) {
  const assignment = assignmentsData.find(a => a.id === assignmentId);
  if (!assignment) return;

  const subs = submissionsData.filter(s => s.assignment_id === assignmentId);

  let html = '';
  if (!subs.length) {
    html = '<p class="text-muted">No submissions yet.</p>';
  } else {
    subs.forEach(s => {
      const student = usersData.find(u => u.id === s.student_id);
      const statusChip = s.status === 'graded' ? 'chip--success' : 'chip--warning';
      html += `
        <div class="card mb-4">
          <div class="card__body">
            <div class="flex justify-between items-center">
              <div>
                <strong>${escapeHtml(student?.display_name || s.student_id)}</strong>
                <span class="chip ${statusChip} ml-2">${s.status}</span>
                <p class="text-sm text-muted mt-2">Submitted: ${new Date(s.submitted_at).toLocaleString()}</p>
                <p class="mt-2">${escapeHtml(s.content)}</p>
                ${s.feedback ? `<p class="text-sm mt-2"><strong>Feedback:</strong> ${escapeHtml(s.feedback)}</p>` : ''}
              </div>
              <div>
                ${s.status !== 'graded' ? `<button class="btn btn--primary btn--sm grade-btn" data-subid="${s.id}">Grade</button>` : `<span class="font-semibold">${s.grade}/${assignment.max_points}</span>`}
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  const footer = '<button class="btn btn--secondary" id="modal-cancel">Close</button>';
  openModal(`Submissions: ${assignment.title}`, html, footer);

  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);

  // Grade buttons
  document.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal();
      showGradeModal(btn.dataset.subid, assignment, user);
    });
  });
}

/**
 * Show grading modal for a submission.
 * @param {string} subId
 * @param {object} assignment
 * @param {object} user
 */
function showGradeModal(subId, assignment, user) {
  const sub = submissionsData.find(s => s.id === subId);
  if (!sub) return;
  const student = usersData.find(u => u.id === sub.student_id);

  const body = `
    <p><strong>Student:</strong> ${escapeHtml(student?.display_name || sub.student_id)}</p>
    <p><strong>Assignment:</strong> ${escapeHtml(assignment.title)} (max ${assignment.max_points} pts)</p>
    <p class="text-sm text-muted mt-2">${escapeHtml(sub.content)}</p>
    <hr style="border: none; border-top: 1px solid var(--color-border); margin: var(--space-4) 0;">
    <div class="form-group">
      <label for="grade-points" class="form-label form-label--required">Points</label>
      <input id="grade-points" type="number" class="form-input" min="0" max="${assignment.max_points}" required>
    </div>
    <div class="form-group">
      <label for="grade-feedback" class="form-label">Feedback</label>
      <textarea id="grade-feedback" class="form-textarea" rows="3"></textarea>
    </div>
  `;

  const footer = `
    <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
    <button class="btn btn--primary" id="modal-grade-save">Save Grade</button>
  `;

  openModal('Grade Submission', body, footer);

  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-grade-save')?.addEventListener('click', () => {
    const points = Number(document.getElementById('grade-points')?.value);
    const feedback = document.getElementById('grade-feedback')?.value.trim();

    if (isNaN(points) || points < 0 || points > assignment.max_points) {
      showToast(`Points must be between 0 and ${assignment.max_points}.`, 'warning');
      return;
    }

    // Update submission
    const idx = submissionsData.findIndex(s => s.id === subId);
    if (idx >= 0) {
      submissionsData[idx].grade = points;
      submissionsData[idx].feedback = feedback || null;
      submissionsData[idx].graded_at = new Date().toISOString();
      submissionsData[idx].status = 'graded';
      saveData('submissions', submissionsData);
    }

    // Also add/update grades record
    const gradesData = JSON.parse(localStorage.getItem('openschool_grades') || '[]');
    const letterGrade = getLetterGrade(points / assignment.max_points * 100);
    const gradeRecord = {
      id: generateId('g'),
      student_id: sub.student_id,
      class_id: assignment.class_id,
      assignment_id: assignment.id,
      points,
      max_points: assignment.max_points,
      weight: assignment.weight || 0.25,
      letter_grade: letterGrade,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
      comments: feedback || null
    };
    gradesData.push(gradeRecord);
    saveData('grades', gradesData);

    closeModal();
    showToast(`Graded: ${points}/${assignment.max_points}`, 'success');
    renderTeacherAssignments(user);
  });
}

/**
 * Convert percentage to letter grade.
 * @param {number} pct
 * @returns {string}
 */
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
