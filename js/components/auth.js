// Purpose: Authentication module - static demo login, session management, role routing
/**
 * @module auth
 * Handles login form, demo quick-login buttons, session persistence, and logout.
 * In static mode, passwords are not checked - any value is accepted.
 */

import { loadData, getSession, setSession, clearSession } from '../storage.js';
import { showToast } from './toast.js';

/**
 * Initialize the login page auth flow.
 * Binds form submission and demo quick-login buttons.
 */
export function initAuth() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', handleLogin);
  }

  // Demo quick-login buttons
  document.querySelectorAll('.demo-login').forEach(btn => {
    btn.addEventListener('click', () => {
      const username = btn.dataset.username;
      document.getElementById('username').value = username;
      document.getElementById('password').value = 'demo';
      form?.requestSubmit();
    });
  });
}

/**
 * Handle login form submission.
 * @param {Event} e - Submit event
 */
async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('username');
  const errorEl = document.getElementById('username-error');
  const username = usernameInput.value.trim().toLowerCase();

  if (!username) {
    showFieldError(usernameInput, errorEl, 'Please enter a username.');
    return;
  }

  const users = await loadData('users');
  const user = users.find(u => u.username.toLowerCase() === username && u.active);

  if (!user) {
    showFieldError(usernameInput, errorEl, `User "${username}" not found. Try: admin, teacher, or student.`);
    return;
  }

  // Static demo mode - accept any password
  setSession(user);
  showToast(`Welcome, ${user.display_name}!`, 'success');

  // Route to role-specific dashboard
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

/**
 * Show a field-level error message.
 * @param {HTMLElement} input
 * @param {HTMLElement} errorEl
 * @param {string} message
 */
function showFieldError(input, errorEl, message) {
  input.classList.add('form-input--error');
  input.setAttribute('aria-invalid', 'true');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    input.setAttribute('aria-describedby', errorEl.id);
  }
}

/**
 * Check if user is logged in; redirect to login if not.
 * @returns {object|null} Current user
 */
export function requireAuth() {
  const user = getSession();
  if (!user) {
    window.location.href = getLoginPath();
    return null;
  }
  return user;
}

/**
 * Log out the current user.
 */
export function logout() {
  clearSession();
  window.location.href = getLoginPath();
}

/**
 * Determine login page path relative to current page.
 * @returns {string}
 */
function getLoginPath() {
  if (window.location.pathname.includes('/pages/')) {
    return '../login.html';
  }
  return 'login.html';
}

/**
 * Destroy auth listeners (lifecycle cleanup).
 */
export function destroy() {
  const form = document.getElementById('login-form');
  if (form) {
    form.removeEventListener('submit', handleLogin);
  }
}
