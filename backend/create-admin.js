const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check if admin exists
    const existingAdmin = await db.collection('users').findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin already exists, updating password...');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      await db.collection('users').updateOne(
        { email: 'admin@example.com' },
        { $set: { password: hashedPassword, role: 'admin' } }
      );
      console.log('✅ Admin password updated!');
    } else {
      // Create new admin
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      await db.collection('users').insertOne({
        name: 'System Administrator',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        createdAt: new Date()
      });
      console.log('✅ Admin user created successfully!');
    }
    
    // Verify admin was created
    const verifyAdmin = await db.collection('users').findOne({ email: 'admin@example.com' });
    console.log('\n📋 Admin User Details:');
    console.log('Email:', verifyAdmin.email);
    console.log('Role:', verifyAdmin.role);
    console.log('\n🔑 Login Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: Admin123!');
    
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();