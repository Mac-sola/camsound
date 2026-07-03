# CamSound MERN Migration Status

## Overview
This file captures the current work state for the CamSound migration, including completed work, current parity gaps, and the next high-priority fix.

## Current Status
- Backend and frontend are both present in the mono-repo.
- Auth/user metadata parity has been improved.
- Artist upload flow exists in the frontend and backend.
- Audio playback exists in `AudioContext` and player UI.
- Admin moderation UI exists and can approve/reject songs.

## Completed Work
- Added `country`, `subscriptionStatus`, `bio`, and `phone` support to user auth flow.
- Updated signup page to collect `country`.
- Extended auth responses from `signup` and `login` to include new user fields.
- Added `updateUser()` to `AuthContext` for profile sync.
- Added fan dashboard profile edit controls and display for `country` and plan.
- Added artist profile save support in `ArtistDashboard`.
- Verified frontend build after the profile changes.

## Immediate Priority
### Highest-priority fix in progress
- Validate `POST /api/upload/song` integration end-to-end.
- Confirm frontend upload form fields match backend upload controller requirements.
- Confirm upload request reaches backend and responds correctly.
- Confirm playback uses valid `filePath` and handles mock Cloudinary audio URLs.

## Parity Checklist
### Priority 1: User/Auth/Profile
- [x] `User` schema supports legacy fields
- [x] Signup accepts `country`
- [x] Auth responses include `country` and `subscriptionStatus`
- [x] `AuthContext` stores and updates user metadata
- [x] Fan profile displays `country` and plan
- [x] Artist profile save flow implemented

### Priority 2: Upload + Playback
- [x] Upload form posts multipart with `title`, `genre`, `song_file`, `cover_art`
- [x] Backend upload route validates artist user and audio type
- [x] Backend uses Cloudinary mock fallback when credentials are missing
- [ ] Verify upload request appears in browser/network
- [ ] Confirm `/api/upload/song` returns success/validation output
- [ ] Confirm audio playback uses valid URL from backend

### Priority 3: Fan Experience
- [x] Discover page plays songs via `playSong`
- [x] Favorites, playlists, history, following, and notifications pages exist
- [ ] Confirm all fan-interaction APIs are wired and functional
- [ ] Community comments / discussion UI needs API integration

### Priority 4: Admin & Moderation
- [x] Admin dashboard exists with moderation queue
- [x] Admin can approve/reject songs
- [ ] Confirm moderation state updates backend correctly
- [ ] Confirm admin payment/withdrawal report handling

### Priority 5: Subscriptions & Payments
- [x] Subscription plans API exists
- [x] Withdrawal request API exists
- [ ] Confirm frontend subscription and withdrawal screens connect properly

## Files touched
- `camsound-backend/src/controllers/authcontroller.ts`
- `camsound-backend/src/models/User.ts`
- `camsound-backend/src/controllers/uploadController.ts`
- `camsound-backend/src/utils/cloudinary.ts`
- `camsound-backend/src/middleware/upload.ts`
- `camsound-backend/src/controllers/songsController.ts`
- `camsound-backend/src/middleware/auth.ts`
- `camsound-frontend/src/context/AuthContext.tsx`
- `camsound-frontend/src/context/AudioContext.tsx`
- `camsound-frontend/src/pages/Signup.tsx`
- `camsound-frontend/src/pages/Dashboard.tsx`
- `camsound-frontend/src/pages/ArtistDashboard.tsx`
- `camsound-frontend/src/services/api.ts`
- `camsound-frontend/src/components/Layout.tsx`

## Notes
- The legacy PHP spec requires full UI parity for fans, artists, and admins.
- Current gaps include comments/discussion integration, complete playlist management, and payment/subscription UI wiring.
- `AudioContext` currently maps mock audio URLs to a demo MP3; this may need replacement with real audio sources.

## Next Steps
1. Confirm upload request and response for `/api/upload/song`.
2. Fix any frontend form/multipart mismatch if discovered.
3. Validate audio playback source and mock fallback behavior.
4. Add missing API wiring for comments/community and payments if time allows.
