const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:5000';

// Test credentials
const testEmail = 'artist@camsound.com';
const testPassword = 'Artist@123456';

async function test() {
  try {
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

    // Create a minimal WAV file
    const wavBuffer = Buffer.from([
      82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32, 
      16, 0, 0, 0, 1, 0, 1, 0, 68, 172, 0, 0, 136, 88, 1, 0, 2, 0, 16, 0, 
      100, 97, 116, 97, 0, 0, 0, 0
    ]);
    
    fs.writeFileSync('temp_test.wav', wavBuffer);
    console.log('✅ Created test WAV file');

    console.log('\n2. Testing upload API...');
    const form = new FormData();
    form.append('title', 'Test Track Upload');
    form.append('genre', 'Afrobeat');
    form.append('song_file', fs.createReadStream('temp_test.wav'));

    const uploadRes = await axios.post(
      `${API_URL}/api/upload/song`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (uploadRes.data.success) {
      console.log('✅ Upload successful!');
      console.log('Response:', JSON.stringify(uploadRes.data, null, 2));
    } else {
      console.log('❌ Upload failed:', uploadRes.data);
    }

    fs.unlinkSync('temp_test.wav');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test();
