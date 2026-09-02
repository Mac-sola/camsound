# QA Testing Plan - CamSound Dashboards

## Phase 1: Fan Dashboard Testing
- [x] Verify Fan Dashboard layout (sidebar, topbar, content area, player bar).
- [x] Click on a song card to trigger audio playback (verify persistent player bar updates).
- [x] Test genre filtering tags (navigate to Genres, verify filter).
- [x] Navigate through sidebar items:
  - [x] Browse
  - [x] Favorites (noted: shows 'Coming Soon' placeholder)
  - [x] Playlists (noted: shows 'Coming Soon' placeholder)
  - [x] Community (verify discussion feed, test composer)
  - [x] History (FanHistory.tsx built)
  - [x] Profile (FanProfile.tsx built)
  - [x] Following (FanFollowing.tsx built)
  - [x] Notifications (FanNotifications.tsx built)
  - [x] Settings (FanSettings.tsx built)
- [x] Log out.


## Phase 2: Artist Dashboard Testing
- [x] Log in with Artist credentials. (Verified 2026-09-02: browser login redirects to `/artist`.)
- [x] Verify Artist Dashboard layout & stats cards. (Verified: dashboard renders profile, stats, top tracks, and player.)
- [x] Test Upload Music form (Title, Genre, file upload). (Verified: MP3 upload returned `201` and the UI reported pending moderation.)
- [x] Check 'My Tracks' section. (Verified: upload view renders existing tracks and statuses.)
- [x] Check 'Analytics / Royalties'. (Verified: both views render.)
- [x] Check 'Artist Profile' editing. (Verified: profile form renders with save controls; no changes submitted.)
- [x] Log out. (Verified: returns to `/login`.)

### Phase 2 validation notes (2026-09-02)
- Artist API login, `/api/auth/me`, `/api/stats/artist`, `/api/artists/me`, and `GET /api/songs?artistId=me&limit=100` responded successfully.
- The artist profile returned 18 stored songs; the track endpoint returned 19 records.
- Frontend production build passed with `npm run build`.
- Removed the upload-view credential debug panel and Axios request-header logging after QA exposed JWT/CSRF values in the browser and console.
- Dashboard load showed `403` responses for some requests and DNS failures for mock CDN image URLs; these did not prevent login or dashboard rendering.

## Phase 3: Admin Dashboard Testing
- [x] Log in with Admin credentials. (Verified 2026-09-02: browser login redirects to `/admin`.)
- [x] Verify Platform Overview metrics. (Verified: totals, user growth chart, and moderation summary render.)
- [x] Test 'Song Moderation' queue (Approve/Reject actions). (Verified: disposable songs approved/rejected; both requests returned `200`.)
- [ ] Test 'User Management' (search/filter, status toggles).
- [x] Test 'Reports' & 'Settings' tabs. (Verified: both views render; read-only API checks returned `200`.)
- [x] Document all UI, layout, or functional issues found.

### Phase 3 validation notes (2026-09-02)
- Admin read-only endpoints `/api/admin/users`, `/api/admin/songs`, `/api/admin/reports`, and `/api/admin/settings` all returned `200`.
- Moderation view currently reports no songs pending moderation, so approve/reject actions remain untested.
- User management search/filter and status-toggle actions remain untested.
- The browser still reports `403` responses for some requests; mock CDN image URLs also fail DNS resolution, although admin navigation and dashboard rendering work.

### Three-dashboard smoke pass (2026-09-02)
- Fan login reached `/fan`, rendered `Welcome back, Fan User!`, and logged out successfully.
- Artist login reached `/artist`, rendered `Artist Dashboard` and `Your Top Tracks`, and logged out successfully.
- Admin login reached `/admin`, rendered the overview, `User Growth`, and `Moderation Queue`, and logged out successfully.
- Note: the login flow routes fans to `/fan`; the older `/dashboard` reference in this checklist does not match the current route definition in `src/App.tsx`.

### Cross-dashboard activity findings (2026-09-02)
- Fan Browse navigation and genre filtering rendered; selecting a track updated the persistent player.
- Fan community posting now requires a song and a song-specific comment returned `201`. Before the fix, a global post attempted to use `community` as a song ID and returned `500` while the UI falsely reported success.
- Fan Like now favorites/unfavorites the associated song; the UI was verified with a `200` response and an `Unlike song` state.
- Fan Reply now posts threaded replies; the UI was verified with a `201` response and the reply form closes on success.
- Fan Create Playlist now loads persisted playlists and creates new playlists; the QA playlist creation returned `201`.
- The shared header search now opens Browse and filters results; `MILANO` returned one matching track.
- Admin user status toggle was verified with a disposable test account: `active -> blocked -> active`, both requests returned `200`.
- Admin moderation was verified end to end: one disposable song was approved and another was rejected, both requests returned `200`, and the pending queue emptied.
- Admin Users has no dedicated search/filter control; the shared header search did not filter the user table during QA.
- A transient Vite HMR reload error appeared while editing `FanCommunity.tsx`; the subsequent production build passed and the live community actions worked.

### Offline development fixes (2026-09-02)
- Uploads now persist under `camsound-backend/public/uploads` and are served locally at `/media/...` when Cloudinary is not configured.
- Fresh upload verification returned a local media URL; a direct request returned `200` with `100` bytes.
- Legacy external/mock audio URLs use the local `/test-tone.wav` fallback by default; set `VITE_OFFLINE_MODE=false` to opt into external media behavior.
- Legacy mock image URLs are normalized to the local `/media-placeholder.svg` asset before rendering.
- Removed Google Fonts and Font Awesome CDN links from the app shell.
- Browser offline check found 11 local image placeholders and no external font, CDN, or MDN requests.

### Visual cleanup (2026-09-02)
- Removed all `linear-gradient` declarations from frontend source and generated build output.
- Replaced gradient surfaces with solid semantic colors while retaining spacing, borders, shadows, and responsive structure.
- Added consistent default button padding, borders, radius, hover states, and a solid text-accent treatment.
- Added local control-symbol fallbacks so essential buttons remain legible without Font Awesome.
- Tightened responsive shared-search sizing to prevent crowding the account controls.
