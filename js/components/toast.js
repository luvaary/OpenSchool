// Purpose: Toast notification component - show/dismiss feedback messages
// Version: 1.1
/**
 * @module toast
 * Provides non-blocking notification toasts for user feedback.
 * Uses CSS-only status indicators instead of emoji icons.
 */

let container = null;

/**
 * Initialize the toast system.
 */
export function init() {
  container = document.getElementById('toast-container');
}

// CSS-based icon letters for each status type
const iconLetters = { success: 'OK', error: '!', warning: '!', info: 'i' };

/**
 * Show a toast notification.
 * @param {string} message - Toast message text
 * @param {'success'|'error'|'warning'|'info'} [type='info'] - Toast type
 * @param {number} [duration=4000] - Auto-dismiss duration in ms (0 = manual only)
 */
export function showToast(message, type = 'info', duration = 4000) {
  if (!container) {
    container = document.getElementById('toast-container');
  }
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-icon toast-icon--${type}" aria-hidden="true">${iconLetters[type] || iconLetters.info}</span>
    <span class="toast__message">${escapeHtml(message)}</span>
    <button class="toast__dismiss" aria-label="Dismiss notification">&times;</button>
  `;

  const dismiss = () => {
    toast.classList.add('toast--exit');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast__dismiss').addEventListener('click', dismiss);

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

/**
 * Escape HTML entities for safe display.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Destroy / cleanup.
 */
export function destroy() {
  if (container) {
    container.innerHTML = '';
  }
}
