# SecureGate

SecureGate is a mobile-first visitor management app for residential societies. Guards log arrivals, residents approve or reject visitors, and admins manage flats, residents, and meetings.

## Features

- Email OTP authentication with role-based access
- Guard visitor logging with compressed photos
- Resident approval workflow and pre-approved guests
- Push notifications for pending visitors
- Society-scoped data access
- Account deletion and theme support

## Local development

### Backend

```bash
cd backend
cp .env.example .env
# Fill JWT_SECRET and, for production, RESEND_API_KEY
npm ci
npm run dev
```

Create the first admin:

```bash
npm run create-admin -- admin@example.com "Admin Name" "+911234567890"
```

### Mobile

```bash
npm ci
cp .env.example .env   # set EXPO_PUBLIC_API_URL if needed
npm start
```

For Android emulators the default API URL is `http://10.0.2.2:5000/api`. Physical devices need `EXPO_PUBLIC_API_URL`.

## Verification

Backend:

```bash
cd backend
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

Mobile:

```bash
npm run typecheck
npx expo export --platform android --no-bytecode --output-dir dist
npm audit --omit=dev --audit-level=high
```

## Deployment

- Backend: deploy `backend/` to Vercel or another Node host. Set all required environment variables.
- Mobile: build with EAS using `eas build`.

## Security

See [SECURITY.md](./SECURITY.md).

## License

MIT. See [LICENSE](./LICENSE).
EOF