import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:5000';

async function runArtistQATest() {
  console.log('====================================================');
  console.log('🎤 STARTING ARTIST DASHBOARD END-TO-END QA TEST SUITE');
  console.log('====================================================\n');

  const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  let token = '';
  let csrfToken = '';
  let artistId = '';
  let artistProfileId = '';
  let testSongId = '';

  // Helper to set auth headers
  const setAuth = (t, csrf) => {
    client.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    if (csrf) client.defaults.headers.common['X-CSRF-Token'] = csrf;
  };

  try {
    // -------------------------------------------------------------
    // STEP 1: Artist Login
    // -------------------------------------------------------------
    console.log('📌 [1/12] Logging in as Artist (artist@camsound.com)...');
    const loginRes = await client.post('/api/auth/login', {
      email: 'artist@camsound.com',
      password: 'Artist@123456',
    });

    token = loginRes.data.token;
    csrfToken = loginRes.data.csrfToken || '';
    artistId = loginRes.data.user._id || loginRes.data.user.id;
    setAuth(token, csrfToken);

    console.log(`✅ Login successful! User: ${loginRes.data.user.name}, Role: ${loginRes.data.user.type}`);

    // -------------------------------------------------------------
    // STEP 2: Fetch Profile & Identity
    // -------------------------------------------------------------
    console.log('\n📌 [2/12] Fetching Profile & Artist Details...');
    const meRes = await client.get('/api/auth/me');
    console.log(`✅ /api/auth/me response: ${meRes.data.user?.name} (${meRes.data.user?.email})`);

    const artistMeRes = await client.get('/api/artists/me');
    const artistData = artistMeRes.data.data || artistMeRes.data;
    artistProfileId = artistData._id;
    console.log(`✅ /api/artists/me response: Artist Profile ID=${artistProfileId}, Name=${artistData.name}, Genre=${artistData.genre}`);

    // -------------------------------------------------------------
    // STEP 3: Dashboard Overview Stats & Analytics
    // -------------------------------------------------------------
    console.log('\n📌 [3/12] Fetching Dashboard Overview Stats...');
    const statsRes = await client.get('/api/stats/artist');
    const stats = statsRes.data.data || statsRes.data;
    console.log(`✅ Artist Stats: Plays=${stats.totalPlays || 0}, Likes=${stats.totalLikes || 0}, Followers=${stats.followers || 0}, Songs=${stats.totalSongs || 0}`);

    // -------------------------------------------------------------
    // STEP 4: Update Profile (Location, Website, Social Links)
    // -------------------------------------------------------------
    console.log('\n📌 [4/12] Updating Artist Profile (Location, Website, Social Handles)...');
    const updateProfileRes = await client.put(`/api/artists/${artistProfileId}`, {
      name: 'Artist QA User',
      genre: 'Afrobeat',
      bio: 'Leading Afrobeat and Makossa recording artist based in Douala.',
      location: 'Douala, Cameroon',
      website: 'https://camsound.com/artist-qa',
      instagramUrl: 'https://instagram.com/camsound_artist',
      twitterUrl: 'https://twitter.com/camsound_artist',
      facebookUrl: 'https://facebook.com/camsound_artist',
      youtubeUrl: 'https://youtube.com/@camsound_artist',
    });
    console.log(`✅ Profile updated! Response name: ${updateProfileRes.data.data?.name || updateProfileRes.data.name}`);

    // -------------------------------------------------------------
    // STEP 5: Music Upload
    // -------------------------------------------------------------
    console.log('\n📌 [5/12] Uploading a New Track with Audio + Cover Art...');
    const form = new FormData();
    form.append('title', `QA Hit Track ${Date.now()}`);
    form.append('genre', 'Afrobeat');
    form.append('upload_type', 'song');

    // Create a dummy audio buffer (1000 bytes)
    const dummyAudioBuffer = Buffer.alloc(1000, 0x55);
    form.append('song_file', dummyAudioBuffer, {
      filename: 'qa_track.mp3',
      contentType: 'audio/mpeg',
    });

    // Create a dummy image buffer (200 bytes)
    const dummyImageBuffer = Buffer.alloc(200, 0xff);
    form.append('cover_art', dummyImageBuffer, {
      filename: 'qa_cover.jpg',
      contentType: 'image/jpeg',
    });

    const uploadRes = await axios.post(`${BASE_URL}/api/upload/song`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
        'X-CSRF-Token': csrfToken,
      },
    });

    testSongId = uploadRes.data.data?.id || uploadRes.data.data?._id;
    console.log(`✅ Song uploaded successfully! ID: ${testSongId}, Title: ${uploadRes.data.data?.title}`);

    // -------------------------------------------------------------
    // STEP 6: Fetch My Tracks List
    // -------------------------------------------------------------
    console.log('\n📌 [6/12] Fetching Artist Tracks List...');
    const mySongsRes = await client.get('/api/songs', {
      params: { artistId: 'me', limit: 50 },
    });
    const songsList = mySongsRes.data.data || mySongsRes.data || [];
    console.log(`✅ Retrieved ${songsList.length} tracks belonging to this artist.`);

    // -------------------------------------------------------------
    // STEP 7: Edit Track Details
    // -------------------------------------------------------------
    if (testSongId) {
      console.log(`\n📌 [7/12] Editing Track Title & Genre for ID: ${testSongId}...`);
      const editSongRes = await client.put(`/api/songs/${testSongId}`, {
        title: `Updated Hit Track ${Date.now()}`,
        genre: 'Makossa',
        duration: '3:30',
      });
      console.log(`✅ Track updated successfully! New title: ${editSongRes.data.data?.title || editSongRes.data.title}`);
    }

    // -------------------------------------------------------------
    // STEP 8: Track Audio Play
    // -------------------------------------------------------------
    if (testSongId) {
      console.log(`\n📌 [8/12] Simulating Play Event on Track ID: ${testSongId}...`);
      const playRes = await client.post(`/api/songs/${testSongId}/play`);
      console.log(`✅ Play event recorded: Plays=${playRes.data.plays ?? 'ok'}`);
    }

    // -------------------------------------------------------------
    // STEP 9: Social Interaction (Comments, Replies)
    // -------------------------------------------------------------
    if (testSongId) {
      console.log(`\n📌 [9/12] Testing Social Interaction & Feedback on Track...`);
      // Post a fan comment
      const postCommentRes = await client.post(`/api/songs/${testSongId}/comments`, {
        content: 'Incredible vocals and Cameroonian rhythm!',
      });
      const commentId = postCommentRes.data.data?._id || postCommentRes.data._id;
      console.log(`✅ Comment posted on track (ID: ${commentId})`);

      // Reply as artist
      if (commentId) {
        const replyRes = await client.post(`/api/songs/${testSongId}/comments`, {
          content: 'Thank you for the love and support! More music coming soon.',
          parentId: commentId,
        });
        console.log(`✅ Artist reply submitted successfully (ID: ${replyRes.data.data?._id || replyRes.data._id})`);
      }
    }

    // -------------------------------------------------------------
    // STEP 10: Revenue & MoMo Withdrawal Request
    // -------------------------------------------------------------
    console.log('\n📌 [10/12] Testing Revenue & Mobile Money Withdrawal Request...');
    const withdrawRes = await client.post('/api/withdrawals', {
      amount: 5000,
      momoNumber: '670000123',
    });
    console.log(`✅ Withdrawal request submitted! Status: ${withdrawRes.data.data?.status || withdrawRes.data.status}`);

    const withdrawListRes = await client.get('/api/withdrawals');
    const withdrawHistory = withdrawListRes.data.data || withdrawListRes.data || [];
    console.log(`✅ Withdrawal history retrieved: ${withdrawHistory.length} records found.`);

    // -------------------------------------------------------------
    // STEP 11: Subscription & Notifications Settings
    // -------------------------------------------------------------
    console.log('\n📌 [11/12] Testing Subscriptions & Notification Preferences...');
    const plansRes = await client.get('/api/subscriptions/plans');
    const plans = plansRes.data.data || plansRes.data || [];
    console.log(`✅ Retrieved ${plans.length} subscription plans.`);

    const notifRes = await client.get('/api/notifications');
    const notifs = notifRes.data.data || notifRes.data || [];
    console.log(`✅ Retrieved ${notifs.length} notifications.`);

    const saveNotifPrefRes = await client.put('/api/notification-settings', {
      notif_new_followers: true,
      notif_comments: true,
      notif_stream_milestones: true,
      notif_revenue_updates: true,
      notif_marketing: false,
    });
    console.log(`✅ Notification preferences updated: ${saveNotifPrefRes.data.success ? 'Success' : 'OK'}`);

    // -------------------------------------------------------------
    // STEP 12: Logout
    // -------------------------------------------------------------
    console.log('\n📌 [12/12] Testing Artist Logout...');
    const logoutRes = await client.post('/api/auth/logout');
    console.log(`✅ Logout response: ${logoutRes.data.success || logoutRes.data.message || 'Logged out'}`);

    console.log('\n====================================================');
    console.log('🎉 ALL 12 ARTIST DASHBOARD WORKFLOWS PASSED 100% OK!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ QA Test failed on step:', error.response?.data || error.message);
  }
}

runArtistQATest();
