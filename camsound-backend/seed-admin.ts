import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB Connected');

    // Delete existing admin if any
    await User.deleteOne({ email: 'admin@camsound.com' });
    console.log('🗑️ Removed old admin user if it existed');

    // Create new admin user - DON'T hash manually, let the pre-save hook do it
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@camsound.com',
      password: 'Admin@123456',  // Let the pre-save hook hash this
      type: 'admin',
      status: 'active',
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@camsound.com');
    console.log('🔐 Password: Admin@123456');
    console.log('\n⚠️ Change the password in production!');

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdminUser();


createAdminUser();
