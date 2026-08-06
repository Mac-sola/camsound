# CamSound

CamSound is a music streaming and artist monetization platform focused on discovery, uploads, artist profiles, fan engagement, and admin moderation. The project combines a modern frontend experience with a backend API layer that supports content publishing, subscriptions, notifications, royalties, and moderation workflows.

This repository contains the active MERN migration target and the legacy PHP/MySQL codebase that it was derived from. The current goal is to preserve the legacy product behavior while moving the platform onto a modern Node.js, Express, React, and MongoDB stack.

## Project purpose

CamSound is designed to help:

- fans discover and stream music
- artists publish songs and manage their profile
- admins moderate content, manage reports, and monitor platform activity
- operators handle subscriptions, payments, notifications, and royalties

The platform is structured around the core business flow:

1. User signup/login
2. Artist song upload and moderation
3. Fan discovery, favorites, playlists, following, and comments
4. Admin oversight and revenue reporting

## Tech stack

### Current MERN target

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript + Node.js
- Database: MongoDB via Mongoose
- Media handling: Cloudinary-compatible upload abstraction with mock fallback for local development

### Legacy source of truth

- PHP/XAMPP app located on the local machine under the Windows XAMPP web root
- MySQL schema dump available in the legacy project
- The legacy version is used as the behavioral reference for migration parity

## Repository structure

- `camsound-backend/` — Express/TypeScript API and MongoDB models
- `camsound-frontend/` — React/Vite client application
- `WORK-IN-PROGRESS.md` — short-lived execution notes and migration checklist
- `README.md` — professional overview and current working status

## Quick start

### Backend

From the backend folder:

```bash
npm install
npm run dev
```

Expected environment values should be provided in `camsound-backend/.env`.

### Frontend

From the frontend folder:

```bash
npm install
npm run dev
```

The frontend reads its API target from `VITE_API_URL`.

## Admin Dashboard — Access Guide

Follow these steps to create an admin account and open the Admin Dashboard locally:

- Start the backend and frontend (see commands below).
- Seed the admin user (creates `admin@camsound.com` with password `Admin@123456`):

```bash
cd camsound-backend
npx ts-node seed-admin.ts
```

- Open the frontend in your browser: http://localhost:5175
- Login with the admin credentials and navigate to `/admin` (the Admin Dashboard).

If you prefer API-based login, POST to `/api/auth/login` on your backend server to retrieve a JWT/cookie, then open the admin UI in the same browser session.

File reference: the seed script is at [camsound-backend/seed-admin.ts](camsound-backend/seed-admin.ts#L1-L200).

## Offline / Local Development

This project is designed to run locally for development. To run fully offline you should host required services locally and use the included development fallbacks where available.

Minimum prerequisites

- Node.js (v16+ recommended)
- npm
- A running MongoDB instance (local `mongod`) or a reachable MongoDB URI

Recommended ports (defaults used by local dev):

- Backend: `http://localhost:5000`
- Frontend (Vite): `http://localhost:5175`

Basic local run steps

```bash
# Backend
cd camsound-backend
npm install
# provide .env with MONGODB_URI and other values, then:
npm run dev

# In a separate terminal: Frontend
cd ../camsound-frontend
npm install
npm run dev
```

Notes for offline operation

- Media uploads: the backend contains a Cloudinary-compatible abstraction and a local/mock fallback used for development. If you do not have Cloudinary credentials, the dev fallback will be used automatically or can be configured via environment settings in `camsound-backend/.env`.
- External services that will not be available offline: payment gateways (MoMo / Stripe), third-party OAuth providers, CDN-hosted fonts/images. For full offline parity you should:
	- Seed the admin account locally using the seed script above.
	- Place font files under `camsound-frontend/public/fonts/` if you want self-hosted fonts available offline.
	- Use the mock/fixture data already present in the repo for testing features that normally call external APIs.

Limitations

- Some production behaviors depend on external services (payments, SMS, email delivery, third-party analytics). Those will be disabled or mocked during offline development.
- If you need a fully deterministic offline test harness (including payments), we can add local mock endpoints for the payment flows — tell me and I will scaffold them.

## Working status: current migration snapshot

This section is the live working guide for the current session. It should be updated as work proceeds so a future return to the project starts from a known state.

### Source of truth

- Open MERN project: this workspace
- Legacy PHP/MySQL reference: located in `C:\xampp\htdocs\camsound`
- Legacy database: `music_app`
- Legacy schema dump: `database_schema.sql`

### What is already working

- Backend and frontend are both present in the monorepo
- Auth and user metadata parity improvements are in place
- Artist upload flow exists in the MERN app
- Audio playback support exists in the frontend audio context
- Admin moderation UI exists for approving and rejecting songs

### Current migration focus

The highest-priority migration task being verified right now is the upload flow parity between the legacy PHP project and the MERN implementation.

Current verified status:

- PHP upload behavior was used as the contract source
- MERN upload route now accepts the compatible legacy-style `upload_type` field
- The frontend uploader sends the expected multipart payload
- Runtime upload smoke testing has confirmed the backend can accept and process the upload successfully

### Current parity checklist

#### Completed / verified

- [x] Legacy PHP project was located and identified as the source-of-truth reference
- [x] Backend health endpoint is reachable
- [x] Upload endpoint can authenticate and accept a multipart song upload
- [x] Upload response returns structured success data in the MERN app
- [x] Frontend build compiles after the upload compatibility update

#### Still being validated

- [ ] Full end-to-end UI behavior for the artist upload screen against the legacy PHP user flow
- [ ] Comments/community feature parity
- [ ] Payments / subscriptions / withdrawal parity
- [ ] Revenue and royalty reporting parity
- [ ] Remaining admin moderation edge-case verification

### Immediate next task

The next feature to bring into tighter parity is the comments/community flow, followed by subscriptions, payments, and withdrawal behavior.

## Development notes

- The MERN app is the active migration target.
- The PHP/MySQL codebase is the behavioral reference for preserving product parity.
- This README should be updated whenever the working session changes direction or a significant feature is verified.
- When returning to the project, start from this file and continue from the current status block above.

## Contribution / maintenance guidance

Use this project readme as the top-level source for:

- product purpose
- architecture context
- current migration status
- next implementation priority

The detailed technical checklist and short-form session notes should remain in `WORK-IN-PROGRESS.md`, while the root `README.md` should stay as the professional, stable project entry point for the repository.
