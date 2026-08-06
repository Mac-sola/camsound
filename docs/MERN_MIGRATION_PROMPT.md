# CamSound Music Streaming Platform - Complete Project Specification
## For MERN (MongoDB, Express, React, Node.js) Migration

---

## PROJECT OVERVIEW

**Platform Name:** CamSound (AfroRhythm) - A comprehensive music streaming platform focused on Cameroonian and African music
**Current Stack:** HTML5, CSS3, Vanilla JavaScript, PHP, MySQL
**Target Stack:** MERN (MongoDB, Express, React, Node.js)
**Database Name:** music_app

---

## DATABASE SCHEMA & DATA MODELS

### 1. **Users Table**
- `id` (Primary Key)
- `name` (varchar 255) - User's display name
- `email` (varchar 255, unique)
- `password` (hashed)
- `type` (enum: 'fan', 'artist', 'admin')
- `avatar` (varchar 500) - Profile picture URL
- `bio` (text) - User biography
- `joined` (timestamp) - Account creation date
- `phone` (varchar 20) - Phone number
- `country` (varchar 100)
- `subscription_status` (enum: 'free', 'premium', 'artist')
- Relationships: One-to-many with Artists, Playlists, Favorites, Follows, Notifications

### 2. **Artists Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `name` (varchar 255) - Artist stage name
- `real_name` (varchar 255) - Real name
- `genre` (varchar 100) - Primary genre (Makossa, Bikutsi, Afrobeat, Traditional, Assiko, Gospel, Hip Hop, etc.)
- `followers` (int) - Follower count
- `songs_count` (int) - Total songs uploaded
- `status` (enum: 'verified', 'pending', 'rejected')
- `verification` (enum: 'approved', 'pending', 'rejected')
- `bio` (text) - Artist biography
- `image` (varchar 500) - Artist avatar/cover
- `instagram_url`, `twitter_url`, `facebook_url`, `youtube_url` - Social media links
- `website` (varchar 255)
- `location` (varchar 255)
- `created_at` (timestamp)

### 3. **Songs Table**
- `id` (Primary Key)
- `title` (varchar 255) - Song title
- `artist_id` (Foreign Key → artists)
- `genre` (varchar 100) - Music genre
- `duration` (varchar 10) - Format: "M:SS" (e.g., "4:32")
- `plays` (int) - Play count
- `likes` (int) - Like count
- `downloads` (int) - Download count
- `file_path` (varchar 500) - Audio file URL/path
- `cover_art` (varchar 500) - Album cover image
- `status` (enum: 'active', 'pending', 'blocked')
- `moderation_status` (enum: 'pending', 'approved', 'rejected')
- `moderation_notes` (text)
- `moderated_by` (Foreign Key → users, nullable)
- `moderated_at` (timestamp, nullable)
- `uploaded_at` (timestamp)
- Relationships: Many-to-many with Playlists via playlist_songs

### 4. **Playlists Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `name` (varchar 255) - Playlist name
- `description` (text)
- `is_public` (tinyint/boolean) - Public/Private
- `created_at` (timestamp)

### 5. **Playlist_Songs Junction Table**
- `id` (Primary Key)
- `playlist_id` (Foreign Key → playlists)
- `song_id` (Foreign Key → songs)
- `added_at` (timestamp)

### 6. **User_Likes Junction Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `song_id` (Foreign Key → songs)
- `created_at` (timestamp)
- Unique constraint on (user_id, song_id)

### 7. **Follows Junction Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users, fan user)
- `artist_id` (Foreign Key → artists)
- `created_at` (timestamp)
- Unique constraint on (user_id, artist_id)

### 8. **Listening_History Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `song_id` (Foreign Key → songs)
- `played_at` (timestamp)
- Index on (user_id, played_at)

### 9. **Notifications Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `message` (text) - Notification message
- `type` (varchar 50) - e.g., 'system', 'new_follower', 'comment', 'song_release'
- `target_id` (int, nullable) - Reference to relevant object (song_id, artist_id, etc.)
- `is_read` (tinyint/boolean)
- `created_at` (timestamp)
- Index on (user_id, is_read)

### 10. **Subscriptions Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `plan_name` (varchar 100) - e.g., 'Free', 'Basic', 'Premium'
- `amount` (decimal 10,2)
- `status` (enum: 'active', 'expired', 'cancelled')
- `start_date` (date)
- `end_date` (date)
- `created_at` (timestamp)

### 11. **Plans Table**
- `id` (Primary Key)
- `name` (varchar 100) - Plan name (Free, Basic, Premium)
- `price` (decimal 10,2)
- `currency` (varchar 10) - e.g., 'FCFA', 'USD'
- `period` (varchar 50) - e.g., '/month', '/year'
- `description` (text)
- `features` (JSON) - Array of features included
- `is_popular` (tinyint/boolean) - Marketing flag
- `button_text` (varchar 50) - CTA button text
- `button_style` (varchar 50) - CSS class for button styling

### 12. **Payments Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users, nullable)
- `subscription_id` (Foreign Key → subscriptions, nullable)
- `amount` (decimal 10,2)
- `currency` (varchar 3) - e.g., 'XAF'
- `payment_method` (varchar 50) - e.g., 'momo', 'card'
- `transaction_id` (varchar 255)
- `status` (enum: 'pending', 'completed', 'failed', 'refunded')
- `created_at` (timestamp)

### 13. **Royalties Table**
- `id` (Primary Key)
- `artist_id` (Foreign Key → artists)
- `song_id` (Foreign Key → songs)
- `amount` (decimal 10,2)
- `period_start` (date)
- `period_end` (date)
- `plays_count` (int) - Number of plays in period
- `calculated_at` (timestamp)
- `paid_at` (timestamp, nullable)
- `status` (enum: 'pending', 'paid')

### 14. **Withdrawals Table**
- `id` (Primary Key)
- `artist_id` (Foreign Key → artists)
- `amount` (decimal 10,2)
- `momo_number` (varchar 20) - Mobile money number
- `status` (enum: 'pending', 'completed', 'failed')
- `transaction_id` (varchar 255, nullable)
- `created_at` (timestamp)
- `processed_at` (timestamp, nullable)

### 15. **Categories/Genres Table**
- `id` (Primary Key)
- `name` (varchar 100)
- `description` (text)
- `parent_id` (Foreign Key → categories, nullable) - For nested genres
- `is_active` (tinyint/boolean)
- `created_at` (timestamp)

### 16. **Comments Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `song_id` (Foreign Key → songs)
- `content` (text) - Comment text
- `parent_id` (Foreign Key → comments, nullable) - For nested replies
- `is_pinned` (tinyint/boolean) - Pin important comments
- `created_at` (timestamp)

### 17. **Featured_Content Table**
- `id` (Primary Key)
- `content_type` (enum: 'song', 'artist', 'playlist')
- `content_id` (int) - ID of featured content
- `position` (int)
- `section` (varchar 100) - e.g., 'hero', 'trending', 'new_releases'
- `start_date` (date)
- `end_date` (date)
- `is_active` (tinyint/boolean)
- `created_by` (Foreign Key → users)
- `created_at` (timestamp)

### 18. **Reports Table**
- `id` (Primary Key)
- `reporter_id` (Foreign Key → users)
- `reported_user_id` (Foreign Key → users, nullable)
- `reported_song_id` (Foreign Key → songs, nullable)
- `type` (enum: 'user', 'song', 'playlist')
- `reason` (text) - Reason for report
- `status` (enum: 'pending', 'reviewed', 'resolved')
- `created_at` (timestamp)
- `reviewed_by` (Foreign Key → users, nullable)
- `reviewed_at` (timestamp, nullable)

### 19. **Settings Table**
- `setting_key` (varchar 100, Primary Key)
- `setting_value` (text) - Platform-wide settings
- `updated_at` (timestamp)

### 20. **Activity_Logs Table**
- `id` (Primary Key)
- `user_id` (Foreign Key → users, nullable)
- `action` (varchar 255) - Type of action
- `details` (text) - Action details
- `ip_address` (varchar 45)
- `user_agent` (text)
- `created_at` (timestamp)

### 21. **Admin_Logs Table**
- `id` (Primary Key)
- `admin_id` (Foreign Key → users)
- `action_type` (varchar 50) - e.g., 'create', 'update', 'delete'
- `target_type` (varchar 50) - e.g., 'user', 'song', 'artist'
- `target_id` (int)
- `details` (text)
- `ip_address` (varchar 45)
- `created_at` (timestamp)
- Indexes on (admin_id), (action_type), (created_at)

### 22. **Ad_Revenue Table**
- `id` (Primary Key)
- `campaign_name` (varchar 255)
- `amount` (decimal 10,2)
- `impressions` (int)
- `clicks` (int)
- `start_date` (date)
- `end_date` (date)
- `status` (enum: 'active', 'completed', 'cancelled')
- `created_at` (timestamp)

### 23. **User_Notification_SETTINGS Table**
- `user_id` (Foreign Key → users)
- `notif_new_followers` (tinyint/boolean, default 1)
- `notif_comments` (tinyint/boolean, default 1)
- `notif_stream_milestones` (tinyint/boolean, default 1)
- `notif_revenue_updates` (tinyint/boolean, default 1)
- `notif_marketing` (tinyint/boolean, default 1)

---

## AUTHENTICATION & AUTHORIZATION

### Session Management
- **Type:** Server-side session with PHP $_SESSION 
- **Storage:** Browser cookies
- **CSRF Protection:** CSRF token validation on all POST/PUT/PATCH/DELETE requests
- **Methods:** 
  - Login endpoint returns user data + CSRF token
  - Session endpoint validates current session
  - Logout endpoint destroys session
  - Password stored as hashed (bcrypt recommended)

### User Types & Permissions

#### 1. **Fan User**
- Browse songs, artists, genres
- Create and manage playlists
- Like/favorite songs
- Follow artists
- View listening history
- View notifications
- Update profile
- Upgrade to premium subscription
- Access to all discover features

#### 2. **Artist User**
- Dashboard with analytics (streams, followers, earnings)
- Upload and manage songs (audio files + cover art)
- View song performance metrics
- Manage artist profile (bio, social links, genres)
- View follower list
- Revenue and royalty tracking
- Request artist verification
- Withdraw earnings via mobile money
- Receive notifications (new followers, comments, milestones)
- Manage notification preferences
- Request artist subscription plan

#### 3. **Admin User**
- Full system access
- Manage users (create, edit, delete, ban)
- Manage artists (verify, reject, monitor)
- Moderate songs (approve, reject, block)
- Moderate comments and reports
- View platform analytics and reports
- Manage subscription plans
- View payment history
- View withdrawal requests
- System settings management
- View admin action logs
- View activity logs
- Ad revenue management

---

## FRONTEND STRUCTURE & DASHBOARDS

<!-- Full frontend spec omitted here for brevity in the WORK-IN-PROGRESS; see original MERN_MIGRATION_PROMPT.md for full UI sections (Fan, Artist, Admin) -->

Refer to the full `MERN_MIGRATION_PROMPT.md` file for complete details.
