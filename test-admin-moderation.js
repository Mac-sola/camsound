const axios = require('axios');
const API_BASE = 'http://localhost:5000/api';

async function testAdminModeration() {
  try {
    console.log('\n🛡️ Admin Moderation Workflow Test');
    console.log('================================\n');

    // Step 1: Login as Admin
    console.log('Step 1: Login as Admin...');
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@camsound.com',
      password: 'Admin@123456',
    });

    if (!adminLoginRes.data.success) {
      throw new Error(`Admin login failed: ${adminLoginRes.data.message}`);
    }

    const adminToken = adminLoginRes.data.token;
    const adminCsrf = adminLoginRes.data.csrfToken;
    console.log('✅ Admin login successful\n');

    // Step 2: Get pending songs (moderation queue)
    console.log('Step 2: Fetching pending songs in moderation queue...');
    const pendingSongsRes = await axios.get(`${API_BASE}/admin/songs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      params: { moderationStatus: 'pending' }
    });

    if (!pendingSongsRes.data.success) {
      throw new Error(`Failed to fetch songs: ${pendingSongsRes.data.message}`);
    }

    const songs = pendingSongsRes.data.data || [];
    console.log(`✅ Found ${songs.length} pending songs\n`);

    if (songs.length === 0) {
      console.log('⚠️ No pending songs to moderate. Uploading a test song first...');
      
      // Login as artist and upload a song
      const artistLoginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'artist@camsound.com',
        password: 'Artist@123456',
      });
      const artistToken = artistLoginRes.data.token;
      const csrfToken = artistLoginRes.data.csrfToken;

      const FormData = require('form-data');
      const fs = require('fs');

      const form = new FormData();
      form.append('upload_type', 'song');
      form.append('title', `Moderation Test ${Date.now()}`);
      form.append('genre', 'Afrobeat');
      
      const mp3Buffer = Buffer.from([0xFF, 0xFB, 0x90, 0x00, ...Array(96).fill(0)]);
      fs.writeFileSync('temp_test.mp3', mp3Buffer);
      form.append('song_file', fs.createReadStream('temp_test.mp3'));

      const uploadRes = await axios.post(`${API_BASE}/upload/song`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${artistToken}`,
          'X-CSRF-Token': csrfToken,
        },
      });

      if (uploadRes.data.success) {
        console.log(`✅ Test song uploaded: ${uploadRes.data.data.id}\n`);
        fs.unlinkSync('temp_test.mp3');
      } else {
        throw new Error('Failed to upload test song');
      }

      // Fetch pending songs again
      const pendingSongsRes2 = await axios.get(`${API_BASE}/admin/songs`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
        params: { moderationStatus: 'pending' }
      });
      songs.push(...(pendingSongsRes2.data.data || []));
    }

    if (songs.length === 0) {
      console.log('❌ Still no pending songs to moderate');
      process.exit(1);
    }

    const testSong = songs[0];
    console.log(`Testing with song: ${testSong.title} (ID: ${testSong._id})\n`);

    // Step 3: Approve the song
    console.log('Step 3: Approving the pending song...');
    const approveRes = await axios.put(
      `${API_BASE}/admin/songs/${testSong._id}/moderate`,
      {
        moderationStatus: 'approved',
        status: 'active',
        moderationNotes: 'Approved during integration test'
      },
      {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'X-CSRF-Token': adminCsrf
        }
      }
    );

    if (!approveRes.data.success) {
      throw new Error(`Approval failed: ${approveRes.data.message}`);
    }

    console.log('✅ Song approved successfully');
    console.log(`   Status: ${approveRes.data.data.status}`);
    console.log(`   Moderation Status: ${approveRes.data.data.moderationStatus}`);
    console.log(`   Moderated By: ${approveRes.data.data.moderatedBy}`);
    console.log(`   Moderated At: ${approveRes.data.data.moderatedAt}\n`);

    // Step 4: Upload another song and test rejection
    console.log('Step 4: Testing rejection workflow...');
    
    const artistLoginRes2 = await axios.post(`${API_BASE}/auth/login`, {
      email: 'artist@camsound.com',
      password: 'Artist@123456',
    });
    const artistToken2 = artistLoginRes2.data.token;
    const csrfToken2 = artistLoginRes2.data.csrfToken;

    const FormData = require('form-data');
    const fs = require('fs');
    
    const form2 = new FormData();
    form2.append('upload_type', 'song');
    form2.append('title', `Rejection Test ${Date.now()}`);
    form2.append('genre', 'Highlife');
    
    const mp3Buffer2 = Buffer.from([0xFF, 0xFB, 0x90, 0x00, ...Array(96).fill(0)]);
    fs.writeFileSync('temp_test2.mp3', mp3Buffer2);
    form2.append('song_file', fs.createReadStream('temp_test2.mp3'));

    const uploadRes2 = await axios.post(`${API_BASE}/upload/song`, form2, {
      headers: {
        ...form2.getHeaders(),
        'Authorization': `Bearer ${artistToken2}`,
        'X-CSRF-Token': csrfToken2,
      },
    });

    if (!uploadRes2.data.success) {
      throw new Error('Failed to upload test song for rejection');
    }

    const songToReject = uploadRes2.data.data;
    console.log(`✅ Test song uploaded: ${songToReject.id}\n`);
    fs.unlinkSync('temp_test2.mp3');

    // Reject the song
    console.log('Rejecting the song...');
    const rejectRes = await axios.put(
      `${API_BASE}/admin/songs/${songToReject.id}/moderate`,
      {
        moderationStatus: 'rejected',
        status: 'inactive',
        moderationNotes: 'Rejected during integration test - copyright violation suspected'
      },
      {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'X-CSRF-Token': adminCsrf
        }
      }
    );

    if (!rejectRes.data.success) {
      throw new Error(`Rejection failed: ${rejectRes.data.message}`);
    }

    console.log('✅ Song rejected successfully');
    console.log(`   Status: ${rejectRes.data.data.status}`);
    console.log(`   Moderation Status: ${rejectRes.data.data.moderationStatus}`);
    console.log(`   Notes: ${rejectRes.data.data.moderationNotes}\n`);

    console.log('✅ All moderation tests passed!');
    console.log('================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testAdminModeration();
