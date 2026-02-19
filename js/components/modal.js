// Purpose: Modal utility - open/close modal dialogs with content injection
/**
 * @module modal
 * Simple modal management: open with title/body/footer HTML, close, trap focus.
 */

let overlay = null;
let lastFocusedElement = null;

/**
 * Initialize modal system - binds escape key and overlay click.
 */
export function init() {
  overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay?.classList.contains('modal-overlay--visible')) {
      closeModal();
    }
  });
}

/**
 * Open the modal with content.
 * @param {string} title - Modal title
 * @param {string} bodyHtml - Inner HTML for modal body
 * @param {string} [footerHtml=''] - Inner HTML for modal footer
 */
export function openModal(title, bodyHtml, footerHtml = '') {
  if (!overlay) overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  lastFocusedElement = document.activeElement;

  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-footer').innerHTML = footerHtml;

  overlay.classList.add('modal-overlay--visible');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus first focusable element
  const firstFocusable = overlay.querySelector('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) firstFocusable.focus();
}

/**
 * Close the modal.
 */
export function closeModal() {
  if (!overlay) return;
  overlay.classList.remove('modal-overlay--visible');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

export function destroy() {
  closeModal();
}
