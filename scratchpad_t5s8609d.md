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
- [ ] Log in with Artist credentials.
- [ ] Verify Artist Dashboard layout & stats cards.
- [ ] Test Upload Music form (Title, Genre, file upload).
- [ ] Check 'My Tracks' section.
- [ ] Check 'Analytics / Royalties'.
- [ ] Check 'Artist Profile' editing.
- [ ] Log out.

## Phase 3: Admin Dashboard Testing
- [ ] Log in with Admin credentials.
- [ ] Verify Platform Overview metrics.
- [ ] Test 'Song Moderation' queue (Approve/Reject actions).
- [ ] Test 'User Management' (search/filter, status toggles).
- [ ] Test 'Reports' & 'Settings' tabs.
- [ ] Document all UI, layout, or functional issues found.
