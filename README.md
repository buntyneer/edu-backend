# EDUMANEGE Backend - School Management System

A production-ready Node.js/Express API for managing schools, users, attendance, messaging, and payments.

## Quick Start
- Install: `npm install`
- Configure: copy `env.example` to `.env` and fill values
- Migrate: `npx prisma generate && npx prisma migrate dev --name init`
- Run dev: `npm run dev` (defaults to `http://localhost:5000`)

## Security & Platform Hardening
- Helmet, CORS (allow-list via `FRONTEND_URL`), rate limiting on `/api`
- JWT access (15m) + refresh (30d) tokens with DB storage
- Passwords hashed with bcrypt (12 rounds)
- Centralized error handling and validation (Joi)
- File uploads via Cloudinary, 5MB limit, image-only filter

## Authentication Flow
- Email/password:
  - `POST /api/auth/register` creates school + admin and issues access/refresh tokens.
  - `POST /api/auth/login` issues tokens on valid credentials.
  - `POST /api/auth/refresh` exchanges a valid refresh token for new tokens.
  - `POST /api/auth/logout` revokes the refresh token.
  - `GET /api/auth/me` returns current user + school (requires `Authorization: Bearer <token>`).
- Google:
  - `POST /api/auth/google` with `{ idToken, schoolId? }`. First-time users need `schoolId`.
- Tokens: send access token in `Authorization: Bearer <token>`. Refresh tokens are persisted in DB.

## Razorpay Payment Flow
- `POST /api/payments/create-order` (auth) with `{ schoolId, plan, amount, notes? }` creates an order and records a pending transaction.
- `POST /api/payments/verify` (auth) validates signature, marks transaction, and activates subscription.
- `POST /api/payments/webhook` handles Razorpay webhooks (signature verified) and stores transaction payloads.
- `GET /api/payments/history` lists transactions for the authenticated school.

## Core Endpoints
Base URL: `/api`

- Auth: `/auth/register`, `/auth/login`, `/auth/google`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- Schools: `/schools/info`, `/schools/stats`, `/schools/:id`
- Students: `/students` (CRUD + `/students/:id/qr-code`)
- Teachers: `/teachers` (CRUD, role TEACHER/USER)
- Attendance: `/attendance/mark`, `/attendance`, `/attendance/reports/monthly`, `/attendance/today`
- Batches: `/batches` (CRUD)
- Messages: `/conversations`, `/messages`, `/broadcast-messages`
- Payments: `/payments/create-order`, `/payments/verify`, `/payments/webhook`, `/payments/history`
- Notifications: `/notifications/send-fcm`, `/notifications/send-push`, `/notifications`, `/notifications/:id/read`
- Holidays: `/holidays`
- Subscriptions: `/subscriptions` (get/update school subscription meta)

## Environment Variables
See `env.example` for the full list:
- `JWT_SECRET`, `DATABASE_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_*`, `FIREBASE_SERVICE_ACCOUNT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- `FRONTEND_URL` (comma-separated origins)

## Deployment on Render
1. Ensure `render.yaml` and `Procfile` are present.
2. Push to your Git repo and connect Render Web Service.
3. Set environment variables in Render dashboard (or sync via `render.yaml`).
4. Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
5. Start command: `npm start`

## Support & Troubleshooting
- Health check: `GET /health`
- Common errors: invalid token (401), validation (400), signature mismatch (400)
- For issues: open a ticket or email support@edumanege.com

