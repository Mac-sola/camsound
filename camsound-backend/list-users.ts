import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB Connected\n');

    const allUsers = await User.find().select('-password');
    
    console.log('📊 All Users in Database:');
    console.log('═'.repeat(80));
    
    if (allUsers.length === 0) {
      console.log('No users found');
    } else {
      allUsers.forEach((user, i) => {
        console.log(`\n${i + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Type: ${user.type}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   _id: ${user._id}`);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log(`✅ Total Users: ${allUsers.length}`);

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

listUsers();
