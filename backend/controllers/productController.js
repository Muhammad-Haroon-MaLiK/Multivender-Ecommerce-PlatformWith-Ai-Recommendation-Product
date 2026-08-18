const Product = require('../models/Product');
const User = require('../models/User');

// Create Product with attributes
const createProduct = async (req, res) => {
  try {
    console.log('Creating product for vendor:', req.user.id);
    
    const { 
      name, description, price, category, stock, 
      discountedPrice, attributes, attributeOptions 
    } = req.body;
    
    // Check if vendor is approved
    const vendor = await User.findById(req.user.id);
    if (!vendor.vendorDetails?.isApproved) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your vendor account is waiting for admin approval.' 
      });
    }
    
    const productData = {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      category,
      vendor: req.user.id,
      vendorId: req.user.id,
      discountedPrice: discountedPrice ? Number(discountedPrice) : null,
      isApproved: false,
      approvalStatus: 'pending'
    };
    
    //  Add attributes if provided
    if (attributes) {
      // Parse if string, otherwise use as is
      productData.attributes = typeof attributes === 'string' 
        ? JSON.parse(attributes) 
        : attributes;
    }
    
    //  Add attribute options if provided
    if (attributeOptions) {
      productData.attributeOptions = typeof attributeOptions === 'string' 
        ? JSON.parse(attributeOptions) 
        : attributeOptions;
    }
    
    // Handle images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/uploads/${file.filename}`);
    }
    
    const product = new Product(productData);
    await product.save();
    
    // Update vendor product count
    if (!vendor.vendorDetails.totalProducts) {
      vendor.vendorDetails.totalProducts = 0;
    }
    vendor.vendorDetails.totalProducts += 1;
    await vendor.save();
    
    console.log('Product saved:', product._id);
    console.log('Attributes:', product.attributes);
    
    res.status(201).json({
      success: true,
      message: 'Product added successfully! Waiting for admin approval.',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all approved products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true })
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get vendor's products
const getVendorProducts = async (req, res) => {
  try {
    console.log('Fetching products for vendor:', req.user.id);
    const products = await Product.find({ vendor: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name email vendorDetails');
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { 
      name, description, price, category, stock, 
      discountedPrice, attributes, attributeOptions 
    } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Check if user owns the product or is admin
    if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this product' 
      });
    }
    
    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (stock !== undefined) product.stock = Number(stock);
    if (discountedPrice !== undefined) {
      product.discountedPrice = discountedPrice ? Number(discountedPrice) : null;
    }
    if (attributes) {
      product.attributes = typeof attributes === 'string' 
        ? JSON.parse(attributes) 
        : attributes;
    }
    if (attributeOptions) {
      product.attributeOptions = typeof attributeOptions === 'string' 
        ? JSON.parse(attributeOptions) 
        : attributeOptions;
    }
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Check if user owns the product or is admin
    if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this product' 
      });
    }
    
    // Decrease vendor product count
    const vendor = await User.findById(product.vendor);
    if (vendor && vendor.vendorDetails) {
      vendor.vendorDetails.totalProducts = Math.max(0, (vendor.vendorDetails.totalProducts || 1) - 1);
      await vendor.save();
    }
    
    await product.deleteOne();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ 
      category: category,
      isApproved: true 
    }).populate('vendor', 'name email');
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get product attributes by category
const getProductAttributesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { getProductAttributes } = require('../config/productAttributes');
    const attributes = getProductAttributes(category);
    
    res.json({
      success: true,
      category,
      attributes
    });
  } catch (error) {
    console.error('Error fetching product attributes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  createProduct, 
  getProducts,
  getVendorProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductAttributesByCategory
};