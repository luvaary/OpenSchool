# Contributing to OpenSchool

Thank you for your interest in contributing! OpenSchool is a community-driven
project and we welcome contributions of all kinds.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Run the setup script: `.\setup.ps1` (Windows) or `python3 -m http.server 8000` (Linux)
4. Open http://localhost:8000 and verify the app works

## Development Guidelines

### Code Style

- **HTML**: Semantic elements, ARIA attributes on interactive elements
- **CSS**: Use existing design tokens from `css/tokens.css`; new components go in `css/components/`
- **JavaScript**: ES2022 modules, no frameworks, no `var`, prefer `const` > `let`
- **Python**: PEP 8, type hints, `from __future__ import annotations`

### Architecture Rules

1. **No external CDNs** — all assets must be local
2. **No frameworks** — vanilla HTML/CSS/JS only
3. **No telemetry** — no analytics, tracking, or phone-home
4. **Progressive enhancement** — core features must work without JavaScript (where feasible)
5. **Accessibility first** — WCAG 2.1 AA minimum for all new features
6. **Keep it light** — total gzipped payload ≤ 300 KB

### File Conventions

- JS components export `init(user)` and optional `destroy()`
- Use `storage.loadData(entity)` / `storage.saveData(entity, data)` for data I/O
- Mark incomplete features with `TODO: TAG_NAME`
- Import new CSS components in `css/styles.css`

### Testing

Before submitting a PR:

```powershell
# Validate data schemas
python scripts/schema_check.py

# Run UI smoke tests
node scripts/ui-smoke-test.js

# Build minified assets
.\scripts\build.ps1     # Windows
bash scripts/build.sh   # Linux
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes with clear, focused commits
3. Ensure all tests pass
4. Update documentation if adding new features
5. Update `CHANGELOG.md` under an `[Unreleased]` section
6. Submit a PR with a clear description of changes

### PR Checklist

- [ ] Code follows existing patterns and conventions
- [ ] ARIA attributes added for interactive elements
- [ ] Tested in light, dark, and high-contrast themes
- [ ] Works without Flask server (static mode)
- [ ] No external dependencies added
- [ ] Schema validation passes
- [ ] UI smoke tests pass
- [ ] Documentation updated (if applicable)

## Reporting Issues

When filing an issue, include:
- Browser and OS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if UI-related)

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Welcome newcomers
- Assume good intentions

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.
