const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function testUpload() {
  try {
    console.log('\n🎵 CamSound Upload Integration Test');
    console.log('================================\n');

    // Step 1: Login as Artist
    console.log('Step 1: Login as Artist...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'artist@camsound.com',
      password: 'Artist@123456',
    });

    if (!loginRes.data.success) {
      throw new Error(`Login failed: ${loginRes.data.message}`);
    }

    const token = loginRes.data.token;
    const csrfToken = loginRes.data.csrfToken;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   CSRF: ${csrfToken ? csrfToken.substring(0, 20) + '...' : 'none'}\n`);

    // Step 2: Create test files
    console.log('Step 2: Creating test audio file...');
    
    // Create a minimal MP3 file (binary)
    const mp3Buffer = Buffer.from([0xFF, 0xFB, 0x90, 0x00, ...Array(96).fill(0)]);
    const coverBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Array(96).fill(0)]);
    
    const audioPath = 'temp_song.mp3';
    const coverPath = 'temp_cover.jpg';
    
    fs.writeFileSync(audioPath, mp3Buffer);
    fs.writeFileSync(coverPath, coverBuffer);

    console.log(`✅ Audio file created: ${audioPath}`);
    console.log(`✅ Cover file created: ${coverPath}\n`);

    // Step 3: Test upload
    console.log('Step 3: Testing upload endpoint...');
    
    const form = new FormData();
    form.append('upload_type', 'song');
    form.append('title', `Test Track ${Math.floor(Math.random() * 9000) + 1000}`);
    form.append('genre', 'Afrobeat');
    form.append('song_file', fs.createReadStream(audioPath));
    form.append('cover_art', fs.createReadStream(coverPath));

    const uploadRes = await axios.post(`${API_BASE}/upload/song`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
        'X-CSRF-Token': csrfToken,
      },
    });

    if (uploadRes.data.success) {
      console.log('✅ Upload successful');
      console.log(`   Song ID: ${uploadRes.data.data.id}`);
      console.log(`   Title: ${uploadRes.data.data.title}`);
      console.log(`   Genre: ${uploadRes.data.data.genre}`);
      console.log(`   Status: ${uploadRes.data.data.status}`);
      console.log(`   Moderation: ${uploadRes.data.data.moderationStatus}`);
      console.log(`   File Path: ${uploadRes.data.data.filePath}\n`);

      console.log('✅ All tests passed!');
      console.log('================================');

      // Cleanup
      fs.unlinkSync(audioPath);
      fs.unlinkSync(coverPath);
      process.exit(0);
    } else {
      throw new Error(`Upload failed: ${uploadRes.data.message}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
    // Cleanup on error
    try {
      if (fs.existsSync('temp_song.mp3')) fs.unlinkSync('temp_song.mp3');
      if (fs.existsSync('temp_cover.jpg')) fs.unlinkSync('temp_cover.jpg');
    } catch {}
    process.exit(1);
  }
}

testUpload();
