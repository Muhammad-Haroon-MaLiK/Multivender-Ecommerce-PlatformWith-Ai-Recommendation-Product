// src/pages/ProductDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import "./ProductDetailPage.css";

const API_URL = "http://localhost:5000/api";
const BASE_URL = "http://localhost:5000";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, wishlistItems } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [toast, setToast] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  // Check if product is in wishlist
  const checkIsInWishlist = () => {
    if (!product) return false;
    const productId = product._id || product.id || product.productId;
    return isInWishlist(productId);
  };

  const [isInWishlistState, setIsInWishlistState] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (product) {
      setIsInWishlistState(checkIsInWishlist());
    }
  }, [product, wishlistItems]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/products/${id}`);
      const productData = res.data.product || res.data;
      
      const vendorId = productData.vendor?._id || productData.vendor?.id || productData.vendorId || null;
      setProduct({
        ...productData,
        vendorId,
        vendorName: productData.vendor?.vendorDetails?.storeName || 
                    productData.vendor?.name || 
                    'Unknown Vendor'
      });

      if (productData.colors?.length) {
        setSelectedColor(productData.colors[0]);
      }
      if (productData.sizes?.length) {
        setSelectedSize(productData.sizes[0]);
      }

      await fetchReviews(id);
    } catch (err) {
      setError("Failed to load product details. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const reviewsRes = await axios.get(`${API_URL}/reviews/${productId}`);
      
      if (reviewsRes.data.success) {
        setReviews(reviewsRes.data.reviews || []);
        setReviewStats({
          averageRating: reviewsRes.data.averageRating || 0,
          totalReviews: reviewsRes.data.reviews?.length || 0,
          distribution: reviewsRes.data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      } else {
        setReviews([]);
      }
    } catch (reviewErr) {
      console.warn('Failed to fetch reviews:', reviewErr);
      setReviews([]);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === 'string') {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }
      if (image.startsWith('/uploads/') || image.startsWith('/images/')) {
        return `${BASE_URL}${image}`;
      }
      if (image.startsWith('uploads/') || image.startsWith('images/')) {
        return `${BASE_URL}/${image}`;
      }
      return `${BASE_URL}/uploads/${image}`;
    }
    if (image.url) {
      if (image.url.startsWith('http://') || image.url.startsWith('https://')) {
        return image.url;
      }
      if (image.url.startsWith('/uploads/') || image.url.startsWith('/images/')) {
        return `${BASE_URL}${image.url}`;
      }
      return `${BASE_URL}/uploads/${image.url}`;
    }
    return null;
  };

  // ✅ FIXED: Get image for cart with proper URL handling
  const getImageForCart = () => {
    if (!product) return null;
    
    // Try to get image from various sources
    let imageUrl = null;
    
    // 1. Check images array
    if (product.images && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        imageUrl = img;
      } else if (img && typeof img === 'object' && img.url) {
        imageUrl = img.url;
      }
    }
    
    // 2. Check image property
    if (!imageUrl && product.image) {
      imageUrl = product.image;
    }
    
    // 3. Check productImage property
    if (!imageUrl && product.productImage) {
      imageUrl = product.productImage;
    }
    
    if (!imageUrl) {
      return null;
    }
    
    // For cart, store the URL as-is (relative path)
    // The CartPage will handle the full URL construction
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path starting with /uploads/
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/images/')) {
      return imageUrl;
    }
    
    // If it starts with uploads/ (no leading slash)
    if (imageUrl.startsWith('uploads/') || imageUrl.startsWith('images/')) {
      return `/${imageUrl}`;
    }
    
    // If it's just a filename
    if (!imageUrl.includes('/')) {
      return `/uploads/${imageUrl}`;
    }
    
    return imageUrl;
  };

  // ✅ FIXED: handleAddToCart with proper image handling
  const handleAddToCart = () => {
    if (!product) return;
    
    const vendorId = product.vendorId;
    if (!vendorId) {
      setToast("⚠️ This product is not available for purchase");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (product.stock < quantity) {
      setToast("⚠️ Not enough stock available");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    // Get the image URL for cart
    const imageForCart = getImageForCart();
    console.log('📸 Image for cart:', imageForCart);

    const cartProduct = {
      _id: product._id,
      id: product._id,
      productId: product._id,
      name: product.name,
      price: product.price,
      category: product.category || 'Uncategorized',
      stock: product.stock,
      image: imageForCart, // Store the image URL
      images: product.images, // Keep the original images array
      vendorId: vendorId,
      vendor: product.vendor,
      vendorName: product.vendorName || 'Unknown Vendor',
      color: selectedColor,
      size: selectedSize,
      quantity: quantity,
      description: product.description,
      rating: product.rating
    };

    console.log('🛒 Adding to cart from detail page:', cartProduct);

    addToCart(cartProduct, quantity);
    setToast(`✓ "${product.name}" added to cart`);
    setTimeout(() => setToast(""), 2500);
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    
    const productId = product._id || product.id || product.productId;
    
    setIsWishlistLoading(true);
    
    // Create a clean product object for wishlist
    const wishlistProduct = {
      _id: productId,
      id: productId,
      productId: productId,
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image: product.images?.[0]?.url || product.image,
      images: product.images,
      description: product.description,
      rating: product.rating,
      vendor: product.vendor,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      colors: product.colors,
      sizes: product.sizes,
      originalPrice: product.originalPrice
    };

    if (isInWishlistState) {
      removeFromWishlist(productId);
      setIsInWishlistState(false);
      setToast("🗑️ Removed from wishlist");
    } else {
      addToWishlist(wishlistProduct);
      setIsInWishlistState(true);
      setToast("❤️ Added to wishlist");
    }
    
    setIsWishlistLoading(false);
    setTimeout(() => setToast(""), 2500);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      setToast("⚠️ Please login to submit a review");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!userRating || !reviewText.trim()) {
      setToast("Please provide both rating and review");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await axios.post(
        `${API_URL}/reviews`,
        { 
          productId: id, 
          rating: userRating, 
          comment: reviewText.trim(),
          title: reviewText.trim().slice(0, 100)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        await fetchReviews(id);
        setUserRating(0);
        setReviewText("");
        setToast("✅ Review submitted successfully!");
      } else {
        setToast(res.data.message || "Failed to submit review");
      }
    } catch (err) {
      console.error('Review submission error:', err);
      setToast(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Electronics': '📱',
      'Fashion': '👗',
      'Clothing': '👕',
      'Home & Living': '🏠',
      'Footwear': '👟',
      'Beauty': '💄',
      'Kids & Toys': '🧸'
    };
    return emojis[category] || '📦';
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-loading">
          <div className="product-detail-spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-error">
          <p className="product-detail-error__text">{error || "Product not found"}</p>
          <button className="product-detail-retry" onClick={() => navigate('/products')}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const inStock = product.stock > 0;
  const hasVendor = Boolean(product.vendorId);
  const averageRating = reviewStats.averageRating || 0;
  const totalReviews = reviewStats.totalReviews || 0;

  return (
    <div className="product-detail-page">
      {toast && <div className="product-detail-toast">{toast}</div>}

      <div className="product-detail-breadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        <Link to="/products">{product.category || "Products"}</Link>
        <span>›</span>
        <span>{product.name}</span>
      </div>

      <div className="product-detail-container">
        <div className="product-detail-images">
          <div className="product-detail-main-image">
            {images.length > 0 ? (
              <img 
                src={getImageUrl(images[activeImage])} 
                alt={product.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.parentElement?.querySelector('.product-detail-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="product-detail-fallback"
              style={{ display: images.length > 0 ? 'none' : 'flex' }}
            >
              {getCategoryEmoji(product.category)}
            </div>
            {!inStock && (
              <span className="product-detail-out-of-stock-badge">Out of Stock</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="product-detail-thumbnails">
              {images.map((img, index) => (
                <button
                  key={index}
                  className={`product-detail-thumbnail ${activeImage === index ? 'active' : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={getImageUrl(img)} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-category">{product.category}</div>
          
          <h1 className="product-detail-name">{product.name}</h1>
          
          <div className="product-detail-vendor">
            by <span>{product.vendorName}</span>
          </div>

          <div className="product-detail-rating-summary">
            <span className="product-detail-stars">
              {'★'.repeat(Math.round(averageRating))}
              {'☆'.repeat(5 - Math.round(averageRating))}
            </span>
            <span className="product-detail-rating-number">{averageRating.toFixed(1)}</span>
            <span className="product-detail-review-count">({totalReviews} reviews)</span>
          </div>

          <div className="product-detail-price-row">
            <span className="product-detail-price">Rs {product.price?.toFixed(0)}</span>
            {product.originalPrice && (
              <span className="product-detail-old-price">Rs {product.originalPrice?.toFixed(0)}</span>
            )}
          </div>

          <div className="product-detail-stock">
            {inStock ? (
              <span className="product-detail-stock-in">
                ✔ In Stock: {product.stock} items available
              </span>
            ) : (
              <span className="product-detail-stock-out">✖ Out of Stock</span>
            )}
          </div>

          <div className="product-detail-description">
            <p>{product.description || "No description available."}</p>
          </div>

          {product.colors && product.colors.length > 0 && (
            <div className="product-detail-options">
              <label className="product-detail-options-label">Select Color:</label>
              <div className="product-detail-color-options">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`product-detail-color-btn ${selectedColor === color ? 'active' : ''}`}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color.toLowerCase() }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="product-detail-options">
              <label className="product-detail-options-label">Select Size:</label>
              <div className="product-detail-size-options">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`product-detail-size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button className="product-detail-size-guide">Size Guide</button>
            </div>
          )}

          <div className="product-detail-quantity">
            <label>Quantity:</label>
            <div className="product-detail-quantity-controls">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span>{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
          </div>

          <div className="product-detail-actions">
            <button
              className={`product-detail-add-to-cart ${!inStock || !hasVendor ? 'disabled' : ''}`}
              onClick={handleAddToCart}
              disabled={!inStock || !hasVendor}
            >
              {!inStock ? 'Out of Stock' : !hasVendor ? 'Unavailable' : '🛒 Add to Cart'}
            </button>
            <button
              className={`product-detail-wishlist ${isInWishlistState ? 'active' : ''}`}
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
              aria-label="Add to wishlist"
            >
              {isWishlistLoading ? '⏳' : isInWishlistState ? '❤️' : '🤍'}
            </button>
          </div>

          <div className="product-detail-extra">
            <button className="product-detail-share">📤 Share</button>
          </div>
        </div>
      </div>

      <div className="product-detail-reviews">
        <h2>Reviews & Ratings</h2>
        
        <div className="product-detail-write-review">
          <h3>Write a Review</h3>
          <form onSubmit={handleReviewSubmit}>
            <div className="product-detail-rating-input">
              <label>Your Rating:</label>
              <div className="product-detail-star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`product-detail-star-btn ${userRating >= star ? 'active' : ''}`}
                    onClick={() => setUserRating(star)}
                  >
                    {userRating >= star ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder="Write your review here..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
            <button type="submit" disabled={isSubmittingReview}>
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        <div className="product-detail-reviews-list">
          {reviews.length === 0 ? (
            <p className="product-detail-no-reviews">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="product-detail-review-item">
                <div className="product-detail-review-header">
                  <span className="product-detail-review-author">
                    {review.user?.name || 'Anonymous'}
                  </span>
                  <span className="product-detail-review-rating">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className="product-detail-review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.title && (
                  <h4 className="product-detail-review-title">{review.title}</h4>
                )}
                <p className="product-detail-review-text">{review.comment}</p>
                {review.verifiedPurchase && (
                  <span className="product-detail-verified-purchase">✓ Verified Purchase</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;