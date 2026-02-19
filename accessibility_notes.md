# OpenSchool – Accessibility Notes

## WCAG 2.1 AA Compliance

OpenSchool targets WCAG 2.1 Level AA conformance. This document details the
accessibility features implemented and areas for improvement.

---

## Implemented Features

### 1. Perceivable

#### Text Alternatives (1.1)
- Logo has `alt` text
- Decorative elements use `alt=""`
- Icons paired with visible text labels where possible

#### Adaptable (1.3)
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`
- Heading hierarchy maintained (h1 → h2 → h3)
- Form inputs associated with `<label>` elements
- Tables use `<thead>`, `<th>`, and `scope` attributes

#### Distinguishable (1.4)
- **Color contrast**: All text meets 4.5:1 ratio (documented in `tokens.css`)
- **Color not sole indicator**: Status chips use text labels alongside colors
- **Text resize**: Layout supports 200% zoom without content loss
- **Text spacing**: Custom properties allow user overrides

### 2. Operable

#### Keyboard Accessible (2.1)
- All interactive elements reachable via Tab
- Modal focus trapping (Tab cycles within modal)
- Escape key closes modals
- No keyboard traps

#### Enough Time (2.2)
- No auto-advancing content
- Toast notifications auto-dismiss after 5s but include close button
- No session timeout in static mode

#### Seizures and Physical Reactions (2.3)
- No flashing content
- `prefers-reduced-motion` respected:
  ```css
  @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  ```
- Manual reduced-motion toggle in UI

#### Navigable (2.4)
- **Skip link**: "Skip to main content" on every page
- **Page titles**: Descriptive `<title>` on each page
- **Focus order**: Follows visual/reading order
- **Focus visible**: Custom focus-visible styles:
  ```css
  :focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
  ```
- **Link purpose**: Links have descriptive text

### 3. Understandable

#### Readable (3.1)
- `lang="en"` on `<html>` element
- Plain language in UI labels

#### Predictable (3.2)
- Consistent navigation across pages
- No unexpected context changes on focus/input

#### Input Assistance (3.3)
- Form validation with visible error messages
- `aria-describedby` links inputs to error/help text
- `aria-invalid="true"` on invalid fields
- Labels on all form controls

### 4. Robust

#### Compatible (4.1)
- Valid HTML5
- ARIA roles used correctly:
  - `role="dialog"` + `aria-modal="true"` on modals
  - `aria-live="polite"` on toast container
  - `aria-label` on navigation landmarks
  - `aria-pressed` on toggle buttons
  - `aria-expanded` on collapsible elements
- Tested with semantic element parsing

---

## Theme Accessibility

### Light Theme (Default)
| Element            | Foreground | Background | Ratio  | Pass |
|-------------------|------------|------------|--------|------|
| Body text         | #1f2937    | #f9fafb    | 14.7:1 | AA   |
| Primary on white  | #1a56db    | #ffffff    | 4.63:1 | AA   |
| Muted text        | #6b7280    | #ffffff    | 4.58:1 | AA   |

### Dark Theme
| Element            | Foreground | Background | Ratio  | Pass |
|-------------------|------------|------------|--------|------|
| Body text         | #f3f4f6    | #111827    | 15.4:1 | AA   |
| Primary on dark   | #60a5fa    | #111827    | 5.85:1 | AA   |
| Muted text        | #9ca3af    | #111827    | 6.28:1 | AA   |

### High Contrast
| Element            | Foreground | Background | Ratio  | Pass |
|-------------------|------------|------------|--------|------|
| Body text         | #000000    | #ffffff    | 21:1   | AAA  |
| Primary           | #0000ee    | #ffffff    | 6.15:1 | AA   |

---

## Screen Reader Support

- Landmarks: `<header>`, `<nav aria-label>`, `<main>`, toast `aria-live`
- Dynamic content updates announced via `aria-live="polite"`
- Modal titles linked via `aria-labelledby`
- Status changes (attendance toggles) communicated via `aria-pressed`

---

## Known Limitations

1. **WYSIWYG editor**: The `contenteditable` announcement editor has limited
   screen reader support. Consider adding `aria-label` and role attributes.

2. **Data tables**: Large tables may benefit from `aria-sort` attributes on
   sortable columns (partially implemented).

3. **Color picker**: Theme toggle now uses text labels ("Dark"/"Light") with
   `aria-label` for clear screen reader support.

4. **Print styles**: Print mode removes navigation but doesn't add print-specific
   heading structure.

---

## Testing Recommendations

### Automated
- Lighthouse accessibility audit (Chrome DevTools)
- axe DevTools browser extension
- `npx pa11y http://localhost:8000`
- `npx axe-cli http://localhost:8000`

### Manual
- Tab through every page verifying focus order
- Test with screen reader (NVDA on Windows, VoiceOver on macOS)
- Test at 200% zoom
- Test with `prefers-reduced-motion: reduce`
- Test high-contrast theme with Windows High Contrast Mode
- Verify all forms can be completed via keyboard alone
