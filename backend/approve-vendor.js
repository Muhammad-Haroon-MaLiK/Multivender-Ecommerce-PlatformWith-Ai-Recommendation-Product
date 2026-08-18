const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const approveVendor = async () => {
  try {
    // Connect to MongoDB without deprecated options
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the vendor by email
    const vendorEmail = 'mharoon@gmail.com'; // Your vendor's email
    const vendor = await User.findOne({ email: vendorEmail });

    if (!vendor) {
      console.log(`❌ Vendor with email ${vendorEmail} not found`);
      await mongoose.disconnect();
      return;
    }

    if (vendor.role !== 'vendor') {
      console.log(`❌ User is not a vendor. Role: ${vendor.role}`);
      await mongoose.disconnect();
      return;
    }

    // Check current status
    console.log(`\n📋 Vendor Details:`);
    console.log(`Name: ${vendor.name}`);
    console.log(`Email: ${vendor.email}`);
    console.log(`Store: ${vendor.vendorDetails?.storeName}`);
    console.log(`Current Status: ${vendor.vendorDetails?.isApproved ? 'Approved ✅' : 'Pending ⏳'}`);

    // Approve the vendor using findOneAndUpdate instead of save
    const updatedVendor = await User.findOneAndUpdate(
      { email: vendorEmail },
      { $set: { 'vendorDetails.isApproved': true } },
      { new: true } // Return the updated document
    );

    console.log(`\n✅ Vendor has been APPROVED successfully!`);
    console.log(`New Status: ${updatedVendor.vendorDetails.isApproved ? 'Approved ✅' : 'Still Pending ❌'}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

// Run the function
approveVendor();