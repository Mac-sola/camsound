import mongoose from 'mongoose';
import User from './src/models/User';
import Artist from './src/models/Artist';
import dotenv from 'dotenv';

dotenv.config();

async function seedUsers() {
  if (process.env.ALLOW_TEST_SEED !== 'true') {
    console.error('Refusing to seed test users. Set ALLOW_TEST_SEED=true explicitly for local QA.');
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB connected\n');

    const testUsers = [
      {
        name: 'Artist User',
        email: 'artist@camsound.com',
        password: 'Artist@123456',
        type: 'artist' as const,
        status: 'active' as const,
        bio: 'Professional music artist',
      },
      {
        name: 'Fan User',
        email: 'fan@camsound.com',
        password: 'Fan@123456',
        type: 'fan' as const,
        status: 'active' as const,
        bio: 'Music enthusiast',
      },
    ];

    for (const userData of testUsers) {
      let user = await User.findOne({ email: userData.email });

      if (user) {
        console.log(`${userData.type.toUpperCase()} user already exists: ${userData.email}`);
      } else {
        user = new User(userData);
        await user.save();
        console.log(`${userData.type.toUpperCase()} user created: ${userData.email}`);
      }

      if (userData.type === 'artist') {
        const artist = await Artist.findOne({ userId: user._id });
        if (!artist) {
          await Artist.create({ userId: user._id, name: user.name, bio: user.bio || '' });
          console.log(`Artist profile created for: ${userData.email}`);
        }
      }
    }

    const allUsers = await User.find().select('-password');
    console.log('\nAll users in database:');
    console.log('='.repeat(80));
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} (${u.type}) - ${u.email}`);
    });

    process.exit(0);
  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedUsers();
