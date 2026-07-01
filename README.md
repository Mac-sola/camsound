# CamSound Monorepo

This repository contains the merged CamSound frontend and backend projects.

## Structure

- `camsound-backend/` - Express / TypeScript backend
- `camsound-frontend/` - React / Vite frontend

## Backend

From `camsound-backend`:

- `npm install`
- `npm run dev`

The backend expects environment variables in `camsound-backend/.env`.

## Frontend

From `camsound-frontend`:

- `npm install`
- `npm run dev`

The frontend expects `VITE_API_URL` to point to the backend API.

## Notes

- The merged folder preserves the previous frontend and backend directories.
- Backend routes are mounted under `/api/*`.
- A new royalty management API has been added to support admin payout tracking.
- Royalty records can be viewed by admins and artists, while only admins can create or update payouts.
