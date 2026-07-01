import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB Connected');

    const admin = await User.findOne({ email: 'admin@camsound.com' });
    
    if (!admin) {
      console.log('❌ Admin user NOT found in database');
    } else {
      console.log('✅ Admin user found in database:');
      console.log('  Name:', admin.name);
      console.log('  Email:', admin.email);
      console.log('  Type:', admin.type);
      console.log('  Status:', admin.status);
      console.log('  Password Hash:', admin.password.substring(0, 20) + '...');
      
      // Test password comparison
      const isValid = await admin.comparePassword('Admin@123456');
      console.log('  Password matches "Admin@123456"?', isValid);
    }

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAdmin();
