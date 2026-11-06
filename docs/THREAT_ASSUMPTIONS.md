# Threat Assumptions - Task API (Lab 10)

## Assets to protect
- User accounts and password hashes
- Task data and its ownership
- Admin-only operations (deleting tasks)

## Actors
- Anonymous visitor: no account, can only register or log in
- USER: authenticated, normal role
- ADMIN: authenticated, elevated role, created by seeding only
- Attacker: can send any request to the API with any tool, but has no access to the server or database

## Assumptions
- The API is served over HTTPS in any deployment, so tokens are not sent in plain text
- The JWT secret is stored only in an environment variable and is never committed
- Admin accounts are created by the seed script, never through public registration
- The database is not directly reachable by users

## Threats and mitigations
| Threat | Mitigation in this lab |
|---|---|
| Stolen password database | Passwords stored only as bcrypt hashes (adaptive, salted); hash never returned in responses |
| Guessing credentials | Same generic error and status for unknown email and wrong password; optional login rate limit |
| Forged or tampered token | Tokens are signed with a secret and verified on every protected request |
| Stolen or old token | Short token lifetime; expired tokens are rejected |
| Privilege escalation | Role is checked on the server for each protected operation; registration ignores any role sent by the client |
| Malformed or malicious input | Server-side validation of type, length and format; Prisma uses parameterized queries |
| Information leakage | Generic error messages; no stack traces, SQL errors or hashes in responses |

## Out of scope (known limitations)
- Multi-factor authentication and password reset
- Server-side token revocation (a signed token stays valid until it expires)
- Distributed denial-of-service protection
- Security of the React client beyond calling the API