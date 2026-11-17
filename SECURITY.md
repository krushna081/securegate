# Security

## Reporting a vulnerability

Please do not open public issues for security problems. Report them privately to the repository owner.

## Secrets

- Never commit real API keys, JWT secrets, or push credentials.
- Generate `JWT_SECRET` with `openssl rand -hex 32`.
- Rotate `JWT_SECRET` immediately if it was ever exposed. Rotating invalidates all existing sessions.
- `ALLOW_DEV_OTP` must remain `false` in production. Production deployments require `RESEND_API_KEY`.

## Deployment checklist

- Set `NODE_ENV=production`.
- Set a strong `JWT_SECRET`.
- Set `RESEND_API_KEY` and a verified sender in `EMAIL_FROM`.
- Set `CORS_ORIGINS` to the deployed web origins, if any.
- Set `GUARD_INVITE_CODE` only if guard self-registration is required.
- Run `npm audit --omit=dev --audit-level=high` before deploying.
