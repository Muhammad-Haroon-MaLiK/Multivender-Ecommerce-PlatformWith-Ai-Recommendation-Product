import React, { useState } from 'react';
import './ClothingProductPage.css';

const ProductDetailPage = () => {
  // Product data with category
  const product = {
    id: 1,
    name: 'WILL CLASS JOHN FOR FASHION',
    price: 9.00,
    category: 'Clothing', // Make sure this is exactly 'Clothing'
    stock: 10,
    description: 'Premium quality shirt with unique design. Perfect for casual wear and everyday use.',
    brand: 'WillClass',
    rating: 4.5,
    reviews: 128,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Black', code: '#1a1a1a' },
      { name: 'White', code: '#ffffff' },
      { name: 'Navy', code: '#1a2332' },
      { name: 'Gray', code: '#808080' }
    ]
  };

  // State variables
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [inStock] = useState(true);

  // Log to debug
  console.log('Product Category:', product.category);
  console.log('Is Clothing?', product.category === 'Clothing');

  // Categories that require size selection - Make sure 'Clothing' is included
  const sizeCategories = ['Clothing', 'Shoes', 'Accessories', 'Fashion'];
  
  // Check if product needs size selection
  const requiresSize = sizeCategories.includes(product.category);
  
  // Check if product has sizes defined
  const hasSizes = product.sizes && product.sizes.length > 0;

  // Debug log
  console.log('Requires Size:', requiresSize);
  console.log('Has Sizes:', hasSizes);

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    // Validate based on category
    if (requiresSize && !selectedSize) {
      alert('Please select a size');
      return;
    }
    if (!selectedColor) {
      alert('Please select a color');
      return;
    }
    
    const cartItem = {
      ...product,
      quantity,
      size: selectedSize,
      color: selectedColor,
      category: product.category
    };
    
    alert(`Added ${quantity} ${product.name} item(s) to cart!`);
    console.log('Cart Item:', cartItem);
  };

  return (
    <div className="clothing-page">
      <div className="product-container">
        {/* Left: Product Image Section */}
        <div className="product-image-section">
          <div className="main-image">
            <div className="image-placeholder">
              <span className="product-icon">👕</span>
            </div>
            <div className={`stock-badge ${inStock ? '' : 'out-of-stock'}`}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </div>
          </div>
          <div className="thumbnail-images">
            <div className="thumbnail active">
              <span>👕</span>
            </div>
            <div className="thumbnail">
              <span>👕</span>
            </div>
            <div className="thumbnail">
              <span>👕</span>
            </div>
            <div className="thumbnail">
              <span>👕</span>
            </div>
          </div>
        </div>

        {/* Right: Product Details Section */}
        <div className="product-details-section">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>{product.category}</span>
            <span>›</span>
            <span className="current">{product.name}</span>
          </div>

          {/* Product Name */}
          <h1 className="product-name">{product.name}</h1>

          {/* Brand */}
          <div className="product-brand">by {product.brand}</div>

          {/* Rating */}
          <div className="product-rating">
            <span className="stars">
              {'⭐'.repeat(Math.floor(product.rating))}
              {product.rating % 1 !== 0 && '⭐'}
            </span>
            <span className="rating-text">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="product-price">
            <span className="price">${product.price.toFixed(2)}</span>
            <span className="category-tag">{product.category}</span>
          </div>

          {/* Stock Status */}
          <div className="stock-status">
            <span className={`stock-indicator ${inStock ? 'in-stock' : 'out-of-stock'}`}>
              {inStock ? '✓' : '✗'}
            </span>
            <span className="stock-text">
              {inStock ? `In Stock: ${product.stock} items available` : 'Out of Stock'}
            </span>
          </div>

          {/* Description */}
          <p className="product-description">{product.description}</p>

          {/* Color Selection - Always shown */}
          <div className="selection-group">
            <label className="selection-label">Select Color:</label>
            <div className="color-options">
              {product.colors.map((color, index) => (
                <button
                  key={index}
                  className={`color-option ${selectedColor === color.code ? 'selected' : ''}`}
                  style={{
                    backgroundColor: color.code,
                    border: selectedColor === color.code ? '3px solid #667eea' : '2px solid #ddd',
                    boxShadow: selectedColor === color.code ? '0 0 0 2px white, 0 0 0 4px #667eea' : 'none'
                  }}
                  onClick={() => setSelectedColor(color.code)}
                  title={color.name}
                />
              ))}
            </div>
            {selectedColor && (
              <div className="selected-color-name">
                Selected: {product.colors.find(c => c.code === selectedColor)?.name}
              </div>
            )}
          </div>

          {/* Size Selection - ONLY for Clothing, Shoes, Accessories, Fashion */}
          {requiresSize && hasSizes && (
            <div className="selection-group">
              <div className="size-header">
                <label className="selection-label">Select Size:</label>
                <button className="size-guide-btn">Size Guide 📏</button>
              </div>
              <div className="size-options">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="quantity-section">
            <label className="selection-label">Quantity:</label>
            <div className="quantity-control">
              <button 
                className="quantity-btn" 
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                className="quantity-btn" 
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
            <span className="stock-remaining">
              {product.stock - quantity} remaining
            </span>
          </div>

          {/* Add to Cart Button */}
          <button 
            className="add-to-cart-btn" 
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            {inStock ? '🛒 Add to Cart' : 'Out of Stock'}
          </button>

          {/* Additional Info */}
          <div className="additional-info">
            <div className="info-item">
              <span className="info-icon">🚚</span>
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🔄</span>
              <span>30-day return policy</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <span>Secure payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;