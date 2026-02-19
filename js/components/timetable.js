// Purpose: Timetable module - weekly grid display, today's schedule, drag-drop (future)
/**
 * @module timetable
 * Renders weekly timetable grid and today's schedule summary.
 */

import { loadData } from '../storage.js';

let timetableData = [];
let classesData = [];
let usersData = [];
let enrollmentsData = [];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = [];
for (let h = 8; h <= 16; h++) {
  HOURS.push(`${String(h).padStart(2, '0')}:00`);
}

/**
 * Initialize timetable module.
 * @param {object} user - Current logged-in user
 */
export async function init(user) {
  [timetableData, classesData, usersData, enrollmentsData] = await Promise.all([
    loadData('timetable'),
    loadData('classes'),
    loadData('users'),
    loadData('enrollments')
  ]);

  renderTodaySchedule(user);
}

/**
 * Render today's schedule in a compact list view.
 * @param {object} user
 */
function renderTodaySchedule(user) {
  const container = document.getElementById('timetable-today') || document.getElementById('student-timetable');
  if (!container) return;

  const today = DAYS[new Date().getDay() - 1]; // 0=Sun, so Mon=0 in our array
  if (!today) {
    container.innerHTML = '<p class="text-muted">No classes today (weekend).</p>';
    return;
  }

  let slots;
  if (user.role === 'teacher') {
    slots = timetableData.filter(s => s.day === today && s.teacher_id === user.id);
  } else if (user.role === 'student') {
    const myClassIds = enrollmentsData
      .filter(e => e.student_id === user.id && e.status === 'active')
      .map(e => e.class_id);
    slots = timetableData.filter(s => s.day === today && myClassIds.includes(s.class_id));
  } else {
    slots = timetableData.filter(s => s.day === today);
  }

  slots.sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (!slots.length) {
    container.innerHTML = '<p class="text-muted">No classes scheduled for today.</p>';
    return;
  }

  let html = '<div class="flex flex-col gap-3">';
  slots.forEach(slot => {
    const cls = classesData.find(c => c.id === slot.class_id);
    const teacher = usersData.find(u => u.id === slot.teacher_id);
    html += `
      <div class="flex items-center gap-4" style="padding: var(--space-3); border-left: 4px solid ${slot.color || '#ccc'}; background: var(--color-bg-secondary); border-radius: var(--radius-md);">
        <div style="min-width: 80px; font-weight: var(--weight-semibold); font-size: var(--text-sm);">
          ${slot.start_time} – ${slot.end_time}
        </div>
        <div>
          <strong>${escapeHtml(cls?.name || slot.class_id)}</strong>
          <div class="text-sm text-muted">Room: ${escapeHtml(slot.room)} · ${escapeHtml(teacher?.display_name || '')}</div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  // Add link to full timetable
  html += `<div class="mt-4"><button class="btn btn--secondary btn--sm" id="show-full-timetable">View Full Week</button></div>`;
  container.innerHTML = html;

  document.getElementById('show-full-timetable')?.addEventListener('click', () => {
    renderFullTimetable(user, container);
  });
}

/**
 * Render the full weekly timetable grid.
 * @param {object} user
 * @param {HTMLElement} container
 */
function renderFullTimetable(user, container) {
  let slots;
  if (user.role === 'teacher') {
    slots = timetableData.filter(s => s.teacher_id === user.id);
  } else if (user.role === 'student') {
    const myClassIds = enrollmentsData
      .filter(e => e.student_id === user.id && e.status === 'active')
      .map(e => e.class_id);
    slots = timetableData.filter(s => myClassIds.includes(s.class_id));
  } else {
    slots = [...timetableData];
  }

  let html = '<div class="timetable-grid">';

  // Header row
  html += '<div class="timetable-grid__header">Time</div>';
  DAY_LABELS.forEach(d => {
    html += `<div class="timetable-grid__header">${d}</div>`;
  });

  // Hour rows
  HOURS.forEach(hour => {
    html += `<div class="timetable-grid__time">${hour}</div>`;
    DAYS.forEach(day => {
      const slot = slots.find(s => s.day === day && s.start_time === hour);
      if (slot) {
        const cls = classesData.find(c => c.id === slot.class_id);
        html += `
          <div class="timetable-grid__cell">
            <div class="timetable-slot" style="background: ${slot.color || '#666'};"
                 title="${escapeHtml(cls?.name || '')} — ${slot.start_time}-${slot.end_time}"
                 tabindex="0" role="button"
                 aria-label="${escapeHtml(cls?.name || '')} at ${slot.start_time}">
              <span class="timetable-slot__name">${escapeHtml(cls?.name || slot.class_id)}</span>
              <span class="timetable-slot__room">${escapeHtml(slot.room)}</span>
            </div>
          </div>
        `;
      } else {
        html += '<div class="timetable-grid__cell"></div>';
      }
    });
  });

  html += '</div>';
  html += `<div class="mt-4"><button class="btn btn--secondary btn--sm" id="show-today-timetable">Back to Today</button></div>`;

  container.innerHTML = html;

  document.getElementById('show-today-timetable')?.addEventListener('click', () => {
    renderTodaySchedule(user);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function destroy() {}
