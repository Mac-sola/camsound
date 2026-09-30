const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(testName, details) {
  results.passed.push({ testName, details });
  console.log(`  ✅ [PASS] ${testName}${details ? ` - ${details}` : ''}`);
}

function fail(testName, error) {
  results.failed.push({ testName, error: error.message || error });
  console.error(`  ❌ [FAIL] ${testName} - ${error.message || error}`);
}

function warn(testName, warning) {
  results.warnings.push({ testName, warning });
  console.warn(`  ⚠️ [WARN] ${testName} - ${warning}`);
}

async function runQaAudit() {
  console.log('\n======================================================');
  console.log('   CamSound Automated Production QA Audit Runner');
  console.log('======================================================\n');

  // --- SECTION 1: PUBLIC & LANDING PAGE CHECKS ---
  console.log('--- 1. Testing Landing Page & Public Endpoints ---');
  try {
    const frontendRes = await axios.get(FRONTEND_URL, { timeout: 5000 });
    if (frontendRes.status === 200 && frontendRes.data.includes('<div id="root">')) {
      pass('Frontend Server Rendering', 'Vite root mount container present');
    } else {
      fail('Frontend Server Rendering', 'Root mount container missing');
    }
  } catch (e) {
    fail('Frontend Server Rendering', e);
  }

  try {
    const healthRes = await axios.get(`${API_BASE}/health`);
    if (healthRes.data?.status === 'OK') {
      pass('Backend API Health Check', healthRes.data.message);
    } else {
      fail('Backend API Health Check', 'Unexpected payload');
    }
  } catch (e) {
    fail('Backend API Health Check', e);
  }

  try {
    const publicSettingsRes = await axios.get(`${API_BASE}/settings/public`);
    if (publicSettingsRes.data?.success && publicSettingsRes.data?.data) {
      pass('Public Site Settings API', `Platform: ${publicSettingsRes.data.data.platformName}`);
    } else {
      fail('Public Site Settings API', 'Settings data structure invalid');
    }
  } catch (e) {
    fail('Public Site Settings API', e);
  }

  try {
    const publicSongsRes = await axios.get(`${API_BASE}/songs?limit=6`);
    if (publicSongsRes.data?.success && Array.isArray(publicSongsRes.data?.data)) {
      pass('Public Catalog API (GET /api/songs)', `Returned ${publicSongsRes.data.data.length} songs (Total: ${publicSongsRes.data.total})`);
    } else {
      fail('Public Catalog API', 'Failed to return songs array');
    }
  } catch (e) {
    fail('Public Catalog API', e);
  }

  try {
    const plansRes = await axios.get(`${API_BASE}/subscriptions/plans`);
    if (plansRes.data?.success && Array.isArray(plansRes.data?.data)) {
      pass('Pricing Plans API (GET /api/subscriptions/plans)', `Found ${plansRes.data.data.length} subscription plans`);
    } else {
      fail('Pricing Plans API', 'Plans not returned');
    }
  } catch (e) {
    fail('Pricing Plans API', e);
  }

  // --- SECTION 2: FAN DASHBOARD TEST SUITE ---
  console.log('\n--- 2. Testing Fan Flow & Fan Dashboard Endpoints ---');
  let fanToken = '';
  let fanCsrf = '';
  try {
    const fanLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'fan@camsound.com',
      password: 'Fan@123456'
    });
    if (fanLogin.data?.success && fanLogin.data?.token) {
      fanToken = fanLogin.data.token;
      fanCsrf = fanLogin.data.csrfToken;
      pass('Fan Authentication (POST /api/auth/login)', `Fan: ${fanLogin.data.user.name}`);
    } else {
      fail('Fan Authentication', 'Token missing in response');
    }
  } catch (e) {
    fail('Fan Authentication', e);
  }

  if (fanToken) {
    const fanHeaders = {
      Authorization: `Bearer ${fanToken}`,
      'X-CSRF-Token': fanCsrf
    };

    // Fan Profile
    try {
      const meRes = await axios.get(`${API_BASE}/auth/me`, { headers: fanHeaders });
      if (meRes.data?.success && meRes.data?.user) {
        pass('Fan Profile (GET /api/auth/me)', `User: ${meRes.data.user.email}`);
      } else {
        fail('Fan Profile', 'Invalid payload');
      }
    } catch (e) {
      fail('Fan Profile', e);
    }

    // Fan Session
    try {
      const sessionRes = await axios.get(`${API_BASE}/auth/session`, { headers: fanHeaders });
      if (sessionRes.data?.success && sessionRes.data?.data?.user) {
        pass('Fan Session Validation (GET /api/auth/session)', 'Session active');
      } else {
        fail('Fan Session Validation', 'Session invalid');
      }
    } catch (e) {
      fail('Fan Session Validation', e);
    }

    // Fan Favorites
    try {
      const favRes = await axios.get(`${API_BASE}/favorites`, { headers: fanHeaders });
      if (favRes.data?.success && Array.isArray(favRes.data?.data)) {
        pass('Fan Favorites (GET /api/favorites)', `${favRes.data.data.length} favorites`);
      } else {
        fail('Fan Favorites', 'Favorites missing');
      }
    } catch (e) {
      fail('Fan Favorites', e);
    }

    // Fan Playlists
    try {
      const plRes = await axios.get(`${API_BASE}/playlists`, { headers: fanHeaders });
      if (plRes.data?.success && Array.isArray(plRes.data?.data)) {
        pass('Fan Playlists (GET /api/playlists)', `${plRes.data.data.length} playlists`);
      } else {
        fail('Fan Playlists', 'Playlists missing');
      }
    } catch (e) {
      fail('Fan Playlists', e);
    }

    // Fan History
    try {
      const histRes = await axios.get(`${API_BASE}/history`, { headers: fanHeaders });
      if (histRes.data?.success && Array.isArray(histRes.data?.data)) {
        pass('Fan Listening History (GET /api/history)', `${histRes.data.data.length} records`);
      } else {
        fail('Fan Listening History', 'History missing');
      }
    } catch (e) {
      fail('Fan Listening History', e);
    }

    // Fan Following
    try {
      const folRes = await axios.get(`${API_BASE}/follows`, { headers: fanHeaders });
      if (folRes.data?.success && Array.isArray(folRes.data?.data)) {
        pass('Fan Following (GET /api/follows)', `Following ${folRes.data.data.length} artists`);
      } else {
        fail('Fan Following', 'Follows missing');
      }
    } catch (e) {
      fail('Fan Following', e);
    }

    // Fan Notifications
    try {
      const notifRes = await axios.get(`${API_BASE}/notifications`, { headers: fanHeaders });
      if (notifRes.data?.success && Array.isArray(notifRes.data?.data)) {
        pass('Fan Notifications (GET /api/notifications)', `${notifRes.data.data.length} notifications`);
      } else {
        fail('Fan Notifications', 'Notifications missing');
      }
    } catch (e) {
      fail('Fan Notifications', e);
    }

    // MoMo Payment Simulation Handshake
    try {
      const momoHandshake = await axios.post(
        `${API_BASE}/momo/initiate`,
        { amount: 1000, phone: '677123456', planName: 'Premium Monthly' },
        { headers: fanHeaders }
      );
      if (momoHandshake.data?.success && momoHandshake.data?.transactionId) {
        pass('MTN MoMo Payment Initiation (POST /api/momo/initiate)', `Tx ID: ${momoHandshake.data.transactionId}`);
      } else {
        fail('MTN MoMo Payment Initiation', 'Missing transactionId');
      }
    } catch (e) {
      fail('MTN MoMo Payment Initiation', e);
    }
  }

  // --- SECTION 3: ARTIST DASHBOARD TEST SUITE ---
  console.log('\n--- 3. Testing Artist Flow & Artist Dashboard Endpoints ---');
  let artistToken = '';
  let artistCsrf = '';
  try {
    const artistLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'artist@camsound.com',
      password: 'Artist@123456'
    });
    if (artistLogin.data?.success && artistLogin.data?.token) {
      artistToken = artistLogin.data.token;
      artistCsrf = artistLogin.data.csrfToken;
      pass('Artist Authentication (POST /api/auth/login)', `Artist: ${artistLogin.data.user.name}`);
    } else {
      fail('Artist Authentication', 'Token missing in response');
    }
  } catch (e) {
    fail('Artist Authentication', e);
  }

  if (artistToken) {
    const artistHeaders = {
      Authorization: `Bearer ${artistToken}`,
      'X-CSRF-Token': artistCsrf
    };

    // Artist Profile Details
    try {
      const artistProfileRes = await axios.get(`${API_BASE}/artists/me`, { headers: artistHeaders });
      if (artistProfileRes.data?.success && artistProfileRes.data?.data) {
        pass('Artist Profile (GET /api/artists/me)', `Stage Name: ${artistProfileRes.data.data.name}`);
      } else {
        fail('Artist Profile', 'Artist profile missing');
      }
    } catch (e) {
      fail('Artist Profile', e);
    }

    // Artist Uploaded Songs
    try {
      const artistSongsRes = await axios.get(`${API_BASE}/songs?artistId=me`, { headers: artistHeaders });
      if (artistSongsRes.data?.success && Array.isArray(artistSongsRes.data?.data)) {
        pass('Artist Tracks (GET /api/songs?artistId=me)', `${artistSongsRes.data.data.length} tracks owned`);
      } else {
        fail('Artist Tracks', 'Could not query artist songs');
      }
    } catch (e) {
      fail('Artist Tracks', e);
    }

    // Artist Analytics & Stats
    try {
      const statsRes = await axios.get(`${API_BASE}/stats/artist`, { headers: artistHeaders });
      if (statsRes.data?.success) {
        pass('Artist Analytics (GET /api/stats/artist)', `Streams: ${statsRes.data.data?.totalPlays || 0}`);
      } else {
        fail('Artist Analytics', 'Stats query failed');
      }
    } catch (e) {
      fail('Artist Analytics', e);
    }

    // Artist Royalties
    try {
      const royaltiesRes = await axios.get(`${API_BASE}/royalties`, { headers: artistHeaders });
      if (royaltiesRes.data?.success) {
        pass('Artist Royalties (GET /api/royalties)', 'Royalties retrieved');
      } else {
        fail('Artist Royalties', 'Royalties failed');
      }
    } catch (e) {
      fail('Artist Royalties', e);
    }

    // Artist Withdrawals History
    try {
      const withRes = await axios.get(`${API_BASE}/withdrawals`, { headers: artistHeaders });
      if (withRes.data?.success) {
        pass('Artist Withdrawals (GET /api/withdrawals)', 'Withdrawals history active');
      } else {
        fail('Artist Withdrawals', 'Withdrawals failed');
      }
    } catch (e) {
      fail('Artist Withdrawals', e);
    }
  }

  // --- SECTION 4: ADMIN DASHBOARD TEST SUITE ---
  console.log('\n--- 4. Testing Admin Flow & Admin Dashboard Endpoints ---');
  let adminToken = '';
  let adminCsrf = '';
  try {
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@camsound.com',
      password: 'Admin@123456'
    });
    if (adminLogin.data?.success && adminLogin.data?.token) {
      adminToken = adminLogin.data.token;
      adminCsrf = adminLogin.data.csrfToken;
      pass('Admin Authentication (POST /api/auth/login)', `Admin: ${adminLogin.data.user.name}`);
    } else {
      fail('Admin Authentication', 'Token missing in response');
    }
  } catch (e) {
    fail('Admin Authentication', e);
  }

  if (adminToken) {
    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'X-CSRF-Token': adminCsrf
    };

    // Admin Global Stats
    try {
      const adminStatsRes = await axios.get(`${API_BASE}/admin/stats`, { headers: adminHeaders });
      if (adminStatsRes.data?.success) {
        pass('Admin Global Platform Stats (GET /api/admin/stats)', `Users: ${adminStatsRes.data.data?.totalUsers}, Songs: ${adminStatsRes.data.data?.totalSongs}`);
      } else {
        fail('Admin Global Platform Stats', 'Stats structure invalid');
      }
    } catch (e) {
      fail('Admin Global Platform Stats', e);
    }

    // Admin Users List
    try {
      const adminUsersRes = await axios.get(`${API_BASE}/admin/users?limit=10`, { headers: adminHeaders });
      if (adminUsersRes.data?.success && Array.isArray(adminUsersRes.data?.data)) {
        pass('Admin User Management (GET /api/admin/users)', `Fetched ${adminUsersRes.data.data.length} users`);
      } else {
        fail('Admin User Management', 'Failed to fetch users');
      }
    } catch (e) {
      fail('Admin User Management', e);
    }

    // Admin Moderation Queue
    try {
      const adminSongsRes = await axios.get(`${API_BASE}/admin/songs?moderationStatus=pending`, { headers: adminHeaders });
      if (adminSongsRes.data?.success && Array.isArray(adminSongsRes.data?.data)) {
        pass('Admin Moderation Queue (GET /api/admin/songs?moderationStatus=pending)', `Pending songs: ${adminSongsRes.data.data.length}`);
      } else {
        fail('Admin Moderation Queue', 'Queue query failed');
      }
    } catch (e) {
      fail('Admin Moderation Queue', e);
    }

    // Admin System Logs
    try {
      const adminLogsRes = await axios.get(`${API_BASE}/admin-logs?limit=5`, { headers: adminHeaders });
      if (adminLogsRes.data?.success && Array.isArray(adminLogsRes.data?.data)) {
        pass('Admin Audit Logs (GET /api/admin-logs)', `${adminLogsRes.data.data.length} logs recorded`);
      } else {
        fail('Admin Audit Logs', 'Logs query failed');
      }
    } catch (e) {
      fail('Admin Audit Logs', e);
    }
  }

  // --- SUMMARY ---
  console.log('\n======================================================');
  console.log(`QA AUDIT COMPLETE: ${results.passed.length} Passed, ${results.failed.length} Failed, ${results.warnings.length} Warnings`);
  console.log('======================================================\n');
}

runQaAudit().catch(err => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
