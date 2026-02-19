# Changelog

All notable changes to OpenSchool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-06-20

### Changed
- **Clean code**: Removed all emoji characters from HTML, JS, and CSS source files
- **CSS icons**: Replaced emoji-based icons with CSS-only alternatives (stat cards, toast notifications, nav icons, hamburger menu, theme toggle)
- **Comment formatting**: Replaced box-drawing characters (U+2500, U+2550) and em-dashes with ASCII equivalents in all section dividers and purpose comments
- **Transitions**: Upgraded button, card, nav, modal, form, and toast transitions to smoother easing curves (`cubic-bezier(0.4, 0, 0.2, 1)`)
- **Modal animation**: Spring-eased enter/exit with scale transform
- **Nav hover**: Subtle padding-left shift on hover for tactile feedback
- **Button active**: Scale-down press effect on all buttons
- **Card hover**: Smoother lift with `--transition-smooth` timing
- **Form focus**: Smoother border-color and box-shadow transitions

### Added
- **Animation tokens**: `--transition-smooth` (300ms ease-out), `--transition-spring` (400ms spring curve) in `tokens.css`
- **Animation utilities**: `.animate-fade-in`, `.animate-slide-up`, `.animate-stagger` + `.animate-child` with staggered delays, `@keyframes fadeIn/slideUp/fadeSlideUp/pulseRing` in `styles.css`
- **CSS hamburger icon**: `.hamburger-icon` component replacing Unicode hamburger character
- **CSS theme toggle label**: `.theme-toggle__label` with "Dark"/"Light" text
- **CSS stat icons**: `.stat-icon` with color-coded background classes (`--students`, `--courses`, `--assign`, `--pending`, `--grading`, `--upcoming`, `--complete`)
- **CSS toast icons**: `.toast-icon` with status color classes (`--success`, `--error`, `--warning`, `--info`)
- **docs/USAGE.md**: Comprehensive usage guide with troubleshooting
- **docs/SCHEMA.md**: Complete data schema reference for all 9 entities
- **docs/CODE_STYLE.md**: Coding conventions and accessibility checklist
- **docs/OPUS_REGEN.md**: Guide for using Opus prompt templates
- **Version comments**: Added `/* Version: 1.1 */` to all CSS and key JS files

### Fixed
- Removed `<!-- TODO: SCHOOL_NAME -->` placeholder from `login.html`
- Cleaned duplicate `class` attributes on nav items in `index.html`

## [1.0.0] - 2025-01-01

### Added
- **Core modules**: Attendance, Assignments, Gradebook, Timetable, Announcements
- **Authentication**: Local auth with role-based dashboards (admin, teacher, student)
- **Design system**: CSS custom properties with light, dark, and high-contrast themes
- **Data layer**: JSON flat files with localStorage overlay
- **Optional backend**: Flask + SQLite server with bcrypt auth and CSRF protection
- **Build pipeline**: CSS/JS minification via terser and clean-css-cli
- **Validation tools**: JSON Schema validators (Python & Node.js)
- **UI smoke tests**: Structural HTML checks
- **CSV importer**: Convert Schoolbox/Compass exports to OpenSchool JSON
- **Opus prompts**: 6 automation prompts for Claude Opus integration
- **Accessibility**: WCAG 2.1 AA baseline, skip-links, ARIA, focus management
- **Responsive**: Mobile-first layout with sidebar navigation
- **Print styles**: Clean print output for reports
- **Documentation**: README, CONTRIBUTING, SECURITY, accessibility notes
- **Sample data**: 9 realistic JSON data files for demo/testing
- **One-click setup**: `setup.ps1` for Windows 11
