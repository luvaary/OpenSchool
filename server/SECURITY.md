# OpenSchool – Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in OpenSchool, please report it
responsibly:

1. **Do NOT** open a public issue.
2. Email: security@openschool-project.example (TODO: SECURITY_EMAIL_PLACEHOLDER)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Security Measures

### Authentication
- Passwords hashed with **bcrypt** (cost factor 12, auto-salted)
- Session-based auth with server-side storage
- Session timeout: 1 hour (configurable)
- No plaintext passwords stored or logged

### CSRF Protection
- Double-submit cookie pattern
- All state-changing requests (POST/PUT/DELETE) require `X-CSRF-Token` header
- CSRF token set in cookie (not HttpOnly) for JS access
- SameSite=Lax cookie attribute

### Session Security
- `HttpOnly` cookies (JS cannot access session cookie)
- `SameSite=Lax` to prevent CSRF via navigation
- Session data stored server-side (not in cookie payload)

### Input Validation
- JSON request bodies validated before processing
- SQL parameterized queries (no string concatenation)
- Max request body size: 2 MB
- Content-Type enforcement on API endpoints

### Static Mode Security
- In static/demo mode, data stored in `localStorage` only
- No network requests for auth (local validation)
- Demo passwords are intentionally simple (not for production)
- XSS mitigation via HTML entity escaping in JS

### Secrets Management
- `secrets.json` excluded from version control (`.gitignore`)
- `secrets.example.json` provided as template
- Flask secret key generated randomly if not configured
- No API keys or tokens required for basic operation

### Headers
Consider adding these headers in production (via reverse proxy):
```
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Known Limitations

1. **Static mode** has no server-side auth – all data is client-accessible
2. **Demo passwords** are weak by design (admin123, teacher123, student123)
3. **No rate limiting** in the Flask server (add via Flask-Limiter in production)
4. **No HTTPS** by default (use a reverse proxy like nginx/Caddy)
5. **SQLite** is single-writer – not suitable for high-concurrency production use

## Production Checklist

- [ ] Replace demo passwords with strong credentials
- [ ] Configure `secrets.json` with a strong Flask secret key
- [ ] Enable HTTPS via reverse proxy
- [ ] Set `SESSION_COOKIE_SECURE = True`
- [ ] Add rate limiting (Flask-Limiter)
- [ ] Set up database backups
- [ ] Configure Content-Security-Policy headers
- [ ] Review and restrict CORS if needed
- [ ] Audit dependencies for vulnerabilities (`pip-audit`, `npm audit`)
