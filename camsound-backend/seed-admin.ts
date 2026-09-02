import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

async function createAdminUser() {
  if (process.env.ALLOW_ADMIN_SEED !== 'true') {
    console.error('Refusing to create an admin. Set ALLOW_ADMIN_SEED=true explicitly for this one-time command.');
    process.exitCode = 1;
    return;
  }

  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!name || !email || !password || password.length < 8) {
    console.error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD (at least 8 characters).');
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB Connected');

    // Delete existing admin if any
    await User.deleteOne({ email });
    console.log(`🗑️ Removed existing account for ${email} if it existed`);

    // Create new admin user - DON'T hash manually, let the pre-save hook do it
    const adminUser = new User({
      name,
      email,
      password,
      type: 'admin',
      status: 'active',
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdminUser();
