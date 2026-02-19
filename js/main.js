// Purpose: Main application orchestrator - initializes all page modules based on role
// Version: 1.1
/**
 * @module main
 * Entry point for all dashboard pages. Detects current user session,
 * initializes appropriate components, and handles global UI (theme, nav, logout).
 */

import { getSession, clearSession, loadData, saveData, exportCSV, resetAllData } from './storage.js';
import { init as initToast, showToast } from './components/toast.js';
import { init as initModal } from './components/modal.js';
import * as attendance from './components/attendance.js';
import * as assignments from './components/assignments.js';
import * as gradebook from './components/gradebook.js';
import * as timetable from './components/timetable.js';
import * as announcements from './components/announcements.js';

/**
 * Main initialization - called on all dashboard pages.
 */
export async function init() {
  // Check auth
  const user = getSession();
  if (!user) {
    const loginPath = window.location.pathname.includes('/pages/') ? '../login.html' : 'login.html';
    window.location.href = loginPath;
    return;
  }

  // Init global UI
  initToast();
  initModal();
  setupThemeToggle();
  setupMotionToggle();
  setupMobileNav();
  setupLogout();
  setupRoleSwitcher();
  updateUserDisplay(user);

  // Show/hide sections based on role
  configureVisibility(user);

  // Init all component modules
  try {
    await Promise.all([
      announcements.init(user),
      timetable.init(user),
      assignments.init(user),
      gradebook.init(user)
    ]);

    // Attendance only for teacher/admin
    if (user.role === 'teacher' || user.role === 'admin') {
      await attendance.init(user);
    }

    // Render stats
    await renderStats(user);

    // Bind global export button
    bindGlobalExport(user);

    // Page-specific init
    const page = detectPage();
    if (page === 'teacher') {
      await initTeacherPage(user);
    } else if (page === 'student') {
      await initStudentPage(user);
    } else if (page === 'admin') {
      await initAdminPage(user);
    }
  } catch (err) {
    console.error('[main] Initialization error:', err);
    showToast('An error occurred during initialization.', 'error');
  }
}

/**
 * Initialize per-class page.
 * @param {string} classId
 */
export async function initClassPage(classId) {
  const user = getSession();
  if (!user) { window.location.href = '../login.html'; return; }

  initToast();
  initModal();
  setupThemeToggle();
  setupLogout();

  if (!classId) {
    document.getElementById('class-name').textContent = 'Class not found';
    return;
  }

  const [classes, users, enrollments, assignmentsData, submissionsData, attendanceData] = await Promise.all([
    loadData('classes'), loadData('users'), loadData('enrollments'),
    loadData('assignments'), loadData('submissions'), loadData('attendance')
  ]);

  const cls = classes.find(c => c.id === classId);
  if (!cls) {
    document.getElementById('class-name').textContent = 'Class not found';
    return;
  }

  const teacher = users.find(u => u.id === cls.teacher_id);
  document.getElementById('class-name').textContent = cls.name;
  document.getElementById('class-info').textContent = `${cls.subject} · ${teacher?.display_name || ''} · Room ${cls.room}`;

  // Roster
  const studentIds = enrollments.filter(e => e.class_id === classId && e.status === 'active').map(e => e.student_id);
  const students = users.filter(u => studentIds.includes(u.id));
  const rosterBody = document.getElementById('roster-body');
  if (rosterBody) {
    rosterBody.innerHTML = students.map(s => {
      const records = attendanceData.filter(a => a.student_id === s.id && a.class_id === classId);
      const presentCount = records.filter(r => r.status === 'present').length;
      const rate = records.length ? ((presentCount / records.length) * 100).toFixed(0) + '%' : '—';
      return `<tr><td>${esc(s.display_name)}</td><td>${esc(s.email)}</td><td>${s.year_level || '—'}</td><td>${rate}</td></tr>`;
    }).join('') || '<tr><td colspan="4" class="table-empty">No students enrolled.</td></tr>';
  }

  // Assignments
  const classAssignments = assignmentsData.filter(a => a.class_id === classId);
  const assignContainer = document.getElementById('class-assignments');
  if (assignContainer) {
    if (!classAssignments.length) {
      assignContainer.innerHTML = '<p class="text-muted">No assignments for this class.</p>';
    } else {
      assignContainer.innerHTML = classAssignments.map(a => {
        const subs = submissionsData.filter(s => s.assignment_id === a.id);
        return `
          <div class="flex justify-between items-center mb-3" style="padding:var(--space-2) 0; border-bottom:1px solid var(--color-border);">
            <div>
              <strong>${esc(a.title)}</strong>
              <span class="chip chip--${a.status} ml-2">${a.status}</span>
              <div class="text-sm text-muted">Due: ${new Date(a.due_date).toLocaleDateString()} · ${subs.length} submission(s)</div>
            </div>
            <div>${a.max_points} pts</div>
          </div>
        `;
      }).join('');
    }
  }
}

/* -----------------------------------------
   Dashboard Stats
   ----------------------------------------- */

async function renderStats(user) {
  const statsRow = document.getElementById('stats-row') || document.getElementById('admin-stats') || document.getElementById('student-stats');
  if (!statsRow) return;

  const [users, classes, assignmentsD, submissionsD, attendanceD, enrollments] = await Promise.all([
    loadData('users'), loadData('classes'), loadData('assignments'),
    loadData('submissions'), loadData('attendance'), loadData('enrollments')
  ]);

  let cards = [];
  if (user.role === 'admin') {
    cards = [
      { value: users.length, label: 'Total Users', cssClass: 'stat-icon--students', letter: 'U' },
      { value: classes.length, label: 'Active Classes', cssClass: 'stat-icon--courses', letter: 'C' },
      { value: assignmentsD.length, label: 'Assignments', cssClass: 'stat-icon--assign', letter: 'A' },
      { value: submissionsD.filter(s => s.status === 'submitted').length, label: 'Pending Review', cssClass: 'stat-icon--pending', letter: 'P' }
    ];
  } else if (user.role === 'teacher') {
    const myClasses = classes.filter(c => c.teacher_id === user.id);
    const myAssignments = assignmentsD.filter(a => myClasses.some(c => c.id === a.class_id));
    const ungraded = submissionsD.filter(s => s.status === 'submitted' && myAssignments.some(a => a.id === s.assignment_id));
    cards = [
      { value: myClasses.length, label: 'My Classes', cssClass: 'stat-icon--courses', letter: 'C' },
      { value: myAssignments.length, label: 'Assignments', cssClass: 'stat-icon--assign', letter: 'A' },
      { value: ungraded.length, label: 'To Grade', cssClass: 'stat-icon--grading', letter: 'G' }
    ];
  } else {
    const myClassIds = enrollments.filter(e => e.student_id === user.id && e.status === 'active').map(e => e.class_id);
    const myAssignments = assignmentsD.filter(a => myClassIds.includes(a.class_id) && a.status === 'published');
    const mySubs = submissionsD.filter(s => s.student_id === user.id);
    const submitted = mySubs.length;
    const pending = myAssignments.length - submitted;
    cards = [
      { value: myClassIds.length, label: 'My Classes', cssClass: 'stat-icon--courses', letter: 'C' },
      { value: pending > 0 ? pending : 0, label: 'Due Soon', cssClass: 'stat-icon--upcoming', letter: 'D' },
      { value: submitted, label: 'Submitted', cssClass: 'stat-icon--complete', letter: 'S' }
    ];
  }

  statsRow.innerHTML = cards.map(c => `
    <div class="card stat-card animate-child">
      <div class="flex justify-between items-center">
        <div>
          <div class="stat-card__value">${c.value}</div>
          <div class="stat-card__label">${c.label}</div>
        </div>
        <div class="stat-icon ${c.cssClass}" aria-hidden="true">${c.letter}</div>
      </div>
    </div>
  `).join('');

  // Add stagger animation to parent
  statsRow.classList.add('animate-stagger');
}

/* -----------------------------------------
   Page-specific init
   ----------------------------------------- */

async function initTeacherPage(user) {
  const [classes, submissions, users, enrollments] = await Promise.all([
    loadData('classes'), loadData('submissions'), loadData('users'), loadData('enrollments')
  ]);

  const myClasses = classes.filter(c => c.teacher_id === user.id);
  const container = document.getElementById('teacher-classes');
  if (container) {
    container.innerHTML = myClasses.map(c => {
      const studentCount = enrollments.filter(e => e.class_id === c.id && e.status === 'active').length;
      return `
        <a href="pages/class.html?id=${c.id}" class="card card--clickable" style="text-decoration:none; border-top: 4px solid ${c.color};">
          <div class="card__body">
            <h3 style="margin:0;">${esc(c.name)}</h3>
            <p class="text-sm text-muted mt-2">${esc(c.subject)} · Room ${esc(c.room)}</p>
            <p class="text-sm mt-2">${studentCount} student(s)</p>
          </div>
        </a>
      `;
    }).join('') || '<p class="text-muted">No classes assigned.</p>';
  }

  // Pending submissions
  const pendingContainer = document.getElementById('pending-submissions');
  if (pendingContainer) {
    const myClassIds = myClasses.map(c => c.id);
    const allAssignments = await loadData('assignments');
    const myAssignmentIds = allAssignments.filter(a => myClassIds.includes(a.class_id)).map(a => a.id);
    const pending = submissions.filter(s => s.status === 'submitted' && myAssignmentIds.includes(s.assignment_id));

    if (!pending.length) {
      pendingContainer.innerHTML = '<p class="text-muted">All caught up! No pending submissions.</p>';
    } else {
      pendingContainer.innerHTML = pending.map(s => {
        const student = users.find(u => u.id === s.student_id);
        const assignment = allAssignments.find(a => a.id === s.assignment_id);
        return `
          <div class="flex justify-between items-center mb-3" style="padding:var(--space-2) 0; border-bottom:1px solid var(--color-border);">
            <div>
              <strong>${esc(student?.display_name || s.student_id)}</strong>
              <div class="text-sm text-muted">${esc(assignment?.title || s.assignment_id)} · ${new Date(s.submitted_at).toLocaleString()}</div>
            </div>
            <span class="chip chip--warning">Needs grading</span>
          </div>
        `;
      }).join('');
    }
  }

  const subtitle = document.getElementById('teacher-subtitle');
  if (subtitle) subtitle.textContent = `Welcome, ${user.display_name} — ${myClasses.length} class(es)`;
}

async function initStudentPage(user) {
  const subtitle = document.getElementById('student-subtitle');
  if (subtitle) subtitle.textContent = `Welcome, ${user.display_name}`;
}

async function initAdminPage(user) {
  const [users, classes, enrollments] = await Promise.all([
    loadData('users'), loadData('classes'), loadData('enrollments')
  ]);

  // Users table
  const tbody = document.getElementById('users-table-body');
  if (tbody) {
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${esc(u.display_name)}</td>
        <td>${esc(u.username)}</td>
        <td><span class="chip chip--${u.role === 'admin' ? 'danger' : u.role === 'teacher' ? 'info' : 'success'}">${u.role}</span></td>
        <td>${esc(u.email)}</td>
        <td><span class="chip ${u.active ? 'chip--success' : 'chip--danger'}">${u.active ? 'Active' : 'Inactive'}</span></td>
        <td><button class="btn btn--ghost btn--sm">Edit</button></td>
      </tr>
    `).join('');
  }

  // Classes table
  const ctbody = document.getElementById('classes-table-body');
  if (ctbody) {
    ctbody.innerHTML = classes.map(c => {
      const teacher = users.find(u => u.id === c.teacher_id);
      const studentCount = enrollments.filter(e => e.class_id === c.id && e.status === 'active').length;
      return `
        <tr>
          <td><a href="pages/class.html?id=${c.id}">${esc(c.name)}</a></td>
          <td>${esc(c.subject)}</td>
          <td>${esc(teacher?.display_name || c.teacher_id)}</td>
          <td>${c.year_level}</td>
          <td>${studentCount}</td>
          <td><span class="chip ${c.active ? 'chip--success' : 'chip--danger'}">${c.active ? 'Active' : 'Inactive'}</span></td>
        </tr>
      `;
    }).join('');
  }

  // Report buttons
  document.getElementById('report-attendance')?.addEventListener('click', async () => {
    const att = await loadData('attendance');
    exportCSV(att, 'attendance_summary.csv', ['date', 'class_id', 'student_id', 'status', 'note']);
    showToast('Attendance CSV exported.', 'success');
  });

  document.getElementById('report-grades')?.addEventListener('click', async () => {
    const grades = await loadData('grades');
    exportCSV(grades, 'grade_distribution.csv', ['student_id', 'class_id', 'assignment_id', 'points', 'max_points', 'letter_grade']);
    showToast('Grades CSV exported.', 'success');
  });
}

/* -----------------------------------------
   Global UI
   ----------------------------------------- */

function updateUserDisplay(user) {
  const nameEl = document.getElementById('user-display-name');
  const badgeEl = document.getElementById('user-role-badge');
  const titleEl = document.getElementById('dashboard-title');
  const subtitleEl = document.getElementById('dashboard-subtitle');

  if (nameEl) nameEl.textContent = user.display_name;
  if (badgeEl) {
    badgeEl.textContent = user.role;
    badgeEl.className = `chip chip--${user.role === 'admin' ? 'danger' : user.role === 'teacher' ? 'info' : 'success'}`;
  }
  if (titleEl) titleEl.textContent = `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`;
  if (subtitleEl) subtitleEl.textContent = `Welcome back, ${user.display_name}!`;
}

function configureVisibility(user) {
  const attSection = document.getElementById('attendance-section');
  if (attSection) {
    if (user.role === 'teacher' || user.role === 'admin') {
      attSection.classList.remove('hidden');
    }
  }
  const adminLink = document.getElementById('nav-admin-link');
  if (adminLink && user.role !== 'admin') {
    adminLink.classList.add('hidden');
  }
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const savedTheme = localStorage.getItem('openschool_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const label = btn.querySelector('.theme-toggle__label');
  if (label) label.textContent = savedTheme === 'dark' ? 'Light' : 'Dark';

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('openschool_theme', next);
    const lbl = btn.querySelector('.theme-toggle__label');
    if (lbl) lbl.textContent = next === 'dark' ? 'Light' : 'Dark';
  });
}

function setupMotionToggle() {
  const btn = document.getElementById('motion-toggle');
  if (!btn) return;

  const reduced = localStorage.getItem('openschool_reduce_motion') === 'true';
  if (reduced) document.documentElement.setAttribute('data-reduce-motion', 'true');

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-reduce-motion') === 'true';
    const next = !current;
    document.documentElement.setAttribute('data-reduce-motion', String(next));
    localStorage.setItem('openschool_reduce_motion', String(next));
    showToast(next ? 'Reduced motion enabled.' : 'Animations enabled.', 'info');
  });
}

function setupMobileNav() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('sidebar--open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

function setupLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearSession();
    const loginPath = window.location.pathname.includes('/pages/') ? '../login.html' : 'login.html';
    window.location.href = loginPath;
  });
}

function setupRoleSwitcher() {
  document.querySelectorAll('.role-switch').forEach(btn => {
    btn.addEventListener('click', async () => {
      const role = btn.dataset.role;
      const users = await loadData('users');
      const user = users.find(u => u.role === role && u.active);
      if (user) {
        const { setSession } = await import('./storage.js');
        setSession(user);
        window.location.reload();
      }
    });
  });
}

function bindGlobalExport(user) {
  document.getElementById('export-csv-btn')?.addEventListener('click', async () => {
    const att = await loadData('attendance');
    exportCSV(att, 'full_export.csv');
    showToast('Data exported.', 'success');
  });
}

function detectPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('teacher')) return 'teacher';
  if (path.includes('student')) return 'student';
  if (path.includes('admin')) return 'admin';
  return 'index';
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
