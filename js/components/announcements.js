// Purpose: Announcements module - display, create, publish/unpublish, role-based visibility
/**
 * @module announcements
 * WYSIWYG-lite editor for creating announcements, role-based filtering.
 */

import { loadData, saveData, generateId } from '../storage.js';
import { showToast } from './toast.js';
import { openModal, closeModal } from './modal.js';

let announcementsData = [];

/**
 * Initialize announcements module.
 * @param {object} user - Current logged-in user
 */
export async function init(user) {
  announcementsData = await loadData('announcements');
  renderAnnouncements(user);

  if (user.role === 'admin' || user.role === 'teacher') {
    const newBtn = document.getElementById('new-announcement-btn');
    if (newBtn) {
      newBtn.classList.remove('hidden');
      newBtn.addEventListener('click', () => showCreateModal(user));
    }
  }
}

/**
 * Render announcements list filtered by user role.
 * @param {object} user
 */
function renderAnnouncements(user) {
  const container = document.getElementById('announcements-list') || document.getElementById('student-announcements');
  if (!container) return;

  const visible = announcementsData
    .filter(a => a.published && a.visible_to.includes(user.role))
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, important: 1, normal: 2 };
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  if (!visible.length) {
    container.innerHTML = '<p class="text-muted">No announcements at this time.</p>';
    return;
  }

  let html = '';
  visible.forEach(a => {
    const chipClass = a.priority === 'urgent' ? 'chip--urgent' : a.priority === 'important' ? 'chip--important' : 'chip--neutral';
    const date = new Date(a.created_at).toLocaleDateString();
    html += `
      <article class="mb-4" style="border-left: 4px solid ${a.priority === 'urgent' ? 'var(--color-danger)' : a.priority === 'important' ? 'var(--color-warning)' : 'var(--color-border)'}; padding-left: var(--space-4);">
        <div class="flex items-center gap-2 mb-2">
          <h3 style="margin:0;">${escapeHtml(a.title)}</h3>
          <span class="chip ${chipClass}">${a.priority}</span>
        </div>
        <div class="text-sm text-muted mb-2">${date}</div>
        <div>${a.content}</div>
      </article>
    `;
  });

  container.innerHTML = html;
}

/**
 * Show create announcement modal with WYSIWYG-lite editor.
 * @param {object} user
 */
function showCreateModal(user) {
  const body = `
    <form id="announcement-form">
      <div class="form-group">
        <label for="ann-title" class="form-label form-label--required">Title</label>
        <input id="ann-title" class="form-input" required maxlength="200">
      </div>
      <div class="form-group">
        <label class="form-label form-label--required">Content</label>
        <div class="editor-toolbar" role="toolbar" aria-label="Text formatting">
          <button type="button" data-cmd="bold" title="Bold" aria-label="Bold"><strong>B</strong></button>
          <button type="button" data-cmd="italic" title="Italic" aria-label="Italic"><em>I</em></button>
          <button type="button" data-cmd="underline" title="Underline" aria-label="Underline"><u>U</u></button>
          <button type="button" data-cmd="insertUnorderedList" title="Bullet list" aria-label="Bullet list">• List</button>
        </div>
        <div class="editor-content" id="ann-editor" contenteditable="true"
             role="textbox" aria-multiline="true" aria-label="Announcement content"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="ann-priority" class="form-label">Priority</label>
          <select id="ann-priority" class="form-select">
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Visible To</label>
          <div class="flex gap-3" style="flex-wrap:wrap;">
            <label class="form-check"><input type="checkbox" value="admin" checked> Admin</label>
            <label class="form-check"><input type="checkbox" value="teacher" checked> Teachers</label>
            <label class="form-check"><input type="checkbox" value="student" checked> Students</label>
            <label class="form-check"><input type="checkbox" value="parent"> Parents</label>
          </div>
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn--secondary" id="modal-cancel">Cancel</button>
    <button class="btn btn--primary" id="modal-publish">Publish</button>
  `;

  openModal('New Announcement', body, footer);

  // Bind WYSIWYG toolbar
  document.querySelectorAll('[data-cmd]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.execCommand(btn.dataset.cmd, false, null);
      btn.classList.toggle('active');
    });
  });

  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-publish')?.addEventListener('click', () => {
    const title = document.getElementById('ann-title')?.value.trim();
    const content = document.getElementById('ann-editor')?.innerHTML.trim();
    const priority = document.getElementById('ann-priority')?.value || 'normal';

    if (!title || !content) {
      showToast('Title and content are required.', 'warning');
      return;
    }

    // Sanitize content - strip script tags (basic safe subset)
    const sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');

    const visibleTo = [];
    document.querySelectorAll('#announcement-form input[type="checkbox"]:checked').forEach(cb => {
      visibleTo.push(cb.value);
    });

    const announcement = {
      id: generateId('ann'),
      title,
      content: sanitized,
      author_id: user.id,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: null,
      visible_to: visibleTo,
      priority,
      expires_at: null
    };

    announcementsData.unshift(announcement);
    saveData('announcements', announcementsData);
    closeModal();
    showToast('Announcement published!', 'success');
    renderAnnouncements(user);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function destroy() {}
