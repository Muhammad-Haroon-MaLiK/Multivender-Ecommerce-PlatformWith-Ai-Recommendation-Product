const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const users = [
  {
    name: 'John Customer',
    email: 'customer@example.com',
    password: 'password123',
    isVendor: false,
  },
  {
    name: 'Sarah Vendor',
    email: 'vendor@example.com',
    password: 'vendor123',
    isVendor: true,
    vendorDetails: {
      storeName: 'Sarah\'s Store',
      storeDescription: 'Premium products',
      verified: true,
    },
  },
];

const products = [
  {
    name: 'Minimal Leather Watch',
    description: 'Elegant minimalist watch with genuine leather strap',
    price: 129,
    oldPrice: 180,
    category: 'Fashion',
    emoji: '⌚',
    stock: 50,
    tags: ['best seller', 'new'],
  },
  {
    name: 'Wireless Noise-Cancel Headphones',
    description: 'Premium sound quality with active noise cancellation',
    price: 89,
    oldPrice: 120,
    category: 'Electronics',
    emoji: '🎧',
    stock: 100,
    tags: ['sale'],
  },
  // Add more products as needed
];

const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();

    // Create users
    const createdUsers = await User.insertMany(users);
    const vendor = createdUsers[1];

    // Add vendorId to products
    const productsWithVendor = products.map(product => ({
      ...product,
      vendor: vendor._id,
      vendorName: vendor.name,
    }));

    await Product.insertMany(productsWithVendor);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}