# Code Style Guide

This document defines the coding conventions for OpenSchool. All contributors should follow these guidelines.

---

## General Principles

1. **No frameworks** - Vanilla HTML, CSS, and ES2022+ JavaScript only
2. **No emoji in source** - Use CSS-based icons and text labels instead
3. **ASCII comments** - Use `-` instead of em-dashes, `=` instead of box-drawing characters
4. **WCAG 2.1 AA** - All UI must meet accessibility standards
5. **No telemetry** - Zero tracking, no analytics, no external requests

---

## File Organization

```
css/
  tokens.css          - Design tokens (colors, spacing, typography)
  styles.css          - Master stylesheet (imports + base + utilities)
  components/*.css    - One file per UI component
js/
  main.js             - App orchestrator (entry point)
  storage.js          - Data persistence layer
  components/*.js     - One module per feature domain
data/
  schemas/*.json      - JSON Schema definitions
  sample/*.json       - Sample/seed data
```

### File Headers

Every source file starts with a purpose comment:

```javascript
// Purpose: Brief description of this file's role
// Version: 1.1
```

```css
/* Purpose: Brief description of this file's role */
/* Version: 1.1 */
```

---

## HTML

### Structure
- Use semantic HTML5 elements (`<main>`, `<nav>`, `<section>`, `<header>`)
- Every page includes a skip-link as the first focusable element
- All images have `alt` attributes (empty `alt=""` for decorative images)
- Form inputs have associated `<label>` elements
- Interactive elements have `aria-label` when text content is insufficient

### Naming
- IDs use `kebab-case`: `main-content`, `theme-toggle`
- Data attributes use `data-kebab-case`: `data-role`, `data-class-id`

### No Inline Styles (Preferred)
- Prefer CSS classes over inline `style` attributes
- Exception: Dynamic values set by JavaScript (e.g., color from data)

---

## CSS

### Architecture
- **Design tokens** in `tokens.css` define all values (no magic numbers)
- **BEM naming**: `.block__element--modifier`
  - Block: `.card`, `.nav-link`, `.form-input`
  - Element: `.card__header`, `.card__body`, `.card__footer`
  - Modifier: `.btn--primary`, `.chip--success`, `.card--clickable`

### Custom Properties
- All colors, spacing, and typography reference CSS custom properties
- Theme switching works via `[data-theme]` selectors overriding `:root` values

### Units
- Use `rem` for most sizing (based on 16px root)
- Use `px` only for borders, shadows, and fine details
- Use `var(--space-*)` tokens for all spacing

### Transitions & Animations
- Use token-based durations: `var(--transition-fast)`, `var(--transition-smooth)`
- Respect `prefers-reduced-motion` and `data-reduce-motion`
- Keep animations subtle and purposeful

### Section Comments
```css
/* ==============================================
   Section Name
   ============================================== */
```

---

## JavaScript

### Module System
- ES2022 modules (`import`/`export`)
- Each component module exports `init(user)` and optionally `destroy()`
- Main orchestrator imports and initializes all modules

### Naming Conventions
- Functions: `camelCase` - `setupThemeToggle()`, `renderStats()`
- Constants: `SCREAMING_SNAKE_CASE` - `MAX_TOAST_DURATION`
- DOM elements: `const nameEl = document.getElementById('...')`
- Booleans: prefix with `is`, `has`, `should` - `isActive`, `hasError`

### Error Handling
- Wrap async operations in try/catch
- Show user-facing errors via `showToast(message, 'error')`
- Log technical errors to console with `[module]` prefix

### DOM Manipulation
- Use `textContent` for plain text (never `innerHTML` with user input)
- Escape user-provided content with `esc()` or `escapeHtml()`
- Use `template literals` for HTML generation

### Section Comments
```javascript
/* -----------------------------------------
   Section Name
   ----------------------------------------- */
```

---

## Data & Storage

### Static Mode
- Load from `data/sample/*.json` via `fetch()`
- Overlay with `localStorage` for runtime changes
- All keys prefixed: `openschool_*`

### Conventions
- UUIDs for all entity IDs (format: `usr-001`, `cls-001`, etc.)
- ISO 8601 for all datetimes
- Dates as `YYYY-MM-DD` strings
- Booleans as `true`/`false` (not strings)

---

## Accessibility Checklist

- [ ] All interactive elements are keyboard-focusable
- [ ] Focus order is logical (matches visual order)
- [ ] Color is not the only means of conveying information
- [ ] All form inputs have visible labels
- [ ] Error messages are associated with inputs via `aria-describedby`
- [ ] Modals trap focus and restore it on close
- [ ] `aria-live` regions for dynamic content (toasts, status updates)
- [ ] Skip links present on every page
- [ ] Contrast ratios meet WCAG 2.1 AA (4.5:1 normal, 3:1 large text)
- [ ] Reduced motion is respected

---

## Git Conventions

### Commit Messages
```
type(scope): brief description

- Detail 1
- Detail 2
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Branches
- `main` - stable release
- `dev` - development
- `feat/feature-name` - feature branches
- `fix/issue-number` - bug fix branches
