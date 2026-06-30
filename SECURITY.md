# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x (latest) | ✅ Supported |
| < 1.0 | ❌ No longer supported |

## Reporting a Vulnerability

We take security seriously. Please report vulnerabilities via:

1. **GitHub**: Create a private security advisory at https://github.com/hieuck/Smart-ERP-Next/security/advisories
2. **Email**: Open an issue with label `security` for non-critical findings

**Do not** report security vulnerabilities in public issues.

## Security Measures

This project implements:

- **Authentication**: JWT Bearer tokens with 15min access + 7d refresh rotation
- **Authorization**: Role-based access control (RBAC) with 11 modules × 4 actions
- **API Keys**: Scoped key authentication for integrations (hash-stored)
- **Rate Limiting**: Global (env-configurable) + endpoint-specific (login: 5/min)
- **Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options via Helmet
- **Secrets**: Environment variable based, never hardcoded
- **Dependencies**: Automated `pnpm audit` in CI, weekly Dependabot updates
- **SAST**: CodeQL analysis on every push
- **Container Scanning**: Trivy vulnerability scanner in CI pipeline

## Disclosure Policy

- We will acknowledge receipt within 48 hours
- We aim to resolve critical issues within 7 days
- We will notify reporters when fixes are released
