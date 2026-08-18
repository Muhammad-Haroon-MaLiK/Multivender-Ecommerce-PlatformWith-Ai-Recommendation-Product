// src/pages/ProductsPage.jsx
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import "./ProductsPage.css";

const API_URL = "https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api";
const BASE_URL = "https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api";

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top rated", value: "rating" },
];

const ProductsPage = () => {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Get category and search from URL params
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("q");

  const [activeCategory, setActiveCategory] = useState(categoryParam || "All");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState(searchParam || "");

  useEffect(() => {
    fetchProducts();
  }, []);

  // Update filters when URL params change
  useEffect(() => {
    const newCategory = searchParams.get("category") || "All";
    const newSearch = searchParams.get("q") || "";
    setActiveCategory(newCategory);
    setSearch(newSearch);
  }, [searchParams]);

  // ✅ A product is only "sellable" if it actually has a vendor attached.
  const hasVendor = (product) =>
    Boolean(product?.vendorId || product?.vendor?._id || product?.vendor?.id);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/products`);
      const productsWithVendor = (res.data.products || []).map(product => ({
        ...product,
        vendorId: product.vendor?._id || product.vendor?.id || product.vendorId || null,
        vendorName: product.vendor?.vendorDetails?.storeName || product.vendor?.name || 'Vendor'
      }));
      setProducts(productsWithVendor);
    } catch (err) {
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get image URL - FIXED to handle all cases
  const getImageUrl = (product) => {
    if (!product) return null;

    // Check images array
    if (product.images && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        // If it's a string URL
        if (img.startsWith('http://') || img.startsWith('https://')) {
          return img;
        }
        // If it starts with /uploads/ or /images/
        if (img.startsWith('/uploads/') || img.startsWith('/images/')) {
          return `${BASE_URL}${img}`;
        }
        // If it starts with uploads/ or images/ (no leading slash)
        if (img.startsWith('uploads/') || img.startsWith('images/')) {
          return `${BASE_URL}/${img}`;
        }
        // If it's just a filename
        return `${BASE_URL}/uploads/${img}`;
      }
      if (img.url) {
        if (img.url.startsWith('http://') || img.url.startsWith('https://')) {
          return img.url;
        }
        if (img.url.startsWith('/uploads/') || img.url.startsWith('/images/')) {
          return `${BASE_URL}${img.url}`;
        }
        return `${BASE_URL}/uploads/${img.url}`;
      }
    }

    // Check image property
    if (product.image) {
      if (product.image.startsWith('http://') || product.image.startsWith('https://')) {
        return product.image;
      }
      if (product.image.startsWith('/uploads/') || product.image.startsWith('/images/')) {
        return `${BASE_URL}${product.image}`;
      }
      if (product.image.startsWith('uploads/') || product.image.startsWith('images/')) {
        return `${BASE_URL}/${product.image}`;
      }
      return `${BASE_URL}/uploads/${product.image}`;
    }

    return null;
  };

  // Get the actual image URL for storing in cart
  const getImageForCart = (product) => {
    if (!product) return null;
    
    // Try to get the image URL
    if (product.images && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        // Store the URL as-is for the cart
        if (img.startsWith('/uploads/') || img.startsWith('uploads/')) {
          return img.startsWith('/') ? img : `/${img}`;
        }
        return img;
      }
      if (img.url) {
        if (img.url.startsWith('/uploads/') || img.url.startsWith('uploads/')) {
          return img.url.startsWith('/') ? img.url : `/${img.url}`;
        }
        return img.url;
      }
    }
    
    if (product.image) {
      if (product.image.startsWith('/uploads/') || product.image.startsWith('uploads/')) {
        return product.image.startsWith('/') ? product.image : `/${product.image}`;
      }
      return product.image;
    }
    
    return null;
  };

  const handleAddToCart = (product) => {
    const vendorId = product.vendorId || product.vendor?._id || product.vendor?.id || null;

    if (!vendorId) {
      console.warn('Skipped add-to-cart for vendor-less product:', product._id);
      return;
    }

    // Get the image URL for the cart
    const imageForCart = getImageForCart(product);
    console.log('📸 Image for cart:', imageForCart);

    // Get category - check multiple sources
    const category = product.category || 
                     product.categoryName || 
                     product.categoryId || 
                     'Uncategorized';

    const cartProduct = {
      _id: product._id,
      id: product._id,
      productId: product._id,
      name: product.name,
      price: product.price,
      category: category,
      stock: product.stock,
      image: imageForCart,
      images: product.images,
      vendorId: vendorId,
      vendor: product.vendor,
      vendorName: product.vendor?.vendorDetails?.storeName || product.vendor?.name || 'Unknown Vendor',
      quantity: 1,
      description: product.description,
      rating: product.rating
    };

    console.log('🛒 Adding to cart:', cartProduct);
    addToCart(cartProduct, 1);
    setToast(`✓ "${product.name}" added to cart`);
    setTimeout(() => setToast(""), 2500);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value) {
      setSearchParams({ q: value, ...(activeCategory !== "All" && { category: activeCategory }) });
    } else {
      const params = {};
      if (activeCategory !== "All") params.category = activeCategory;
      setSearchParams(params);
    }
  };

  const clearSearch = () => {
    setSearch("");
    const params = {};
    if (activeCategory !== "All") params.category = activeCategory;
    setSearchParams(params);
  };

  const clearCategory = () => {
    setActiveCategory("All");
    const params = {};
    if (search) params.q = search;
    setSearchParams(params);
  };

  // Filter products
  const filtered = products
    .filter((p) => {
      let matchCategory = true;
      if (activeCategory !== "All") {
        matchCategory = p.category?.toLowerCase() === activeCategory.toLowerCase();
      }

      let matchSearch = true;
      if (search) {
        matchSearch =
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.category?.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase()) ||
          p.vendor?.name?.toLowerCase().includes(search.toLowerCase());
      }

      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

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

  return (
    <div className="products-page">
      {toast && <div className="products-toast">{toast}</div>}

      /* Page Header */
      <div className="products-header">
        <div>
          <h1 className="products-header__title">
            {activeCategory === "All" ? "All Products" : `${activeCategory}`}
          </h1>
          <p className="products-header__sub">
            {loading ? "Loading…" : `${filtered.length} products found`}
          </p>
        </div>

        <div className="products-header__controls">
          <div className="products-search">
            <span className="products-search__icon">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={handleSearchChange}
            />
            {search && (
              <button
                className="products-search__clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <select
            className="products-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      /* Active Filters Bar */
      {(search || activeCategory !== "All") && (
        <div className="products-filters-bar">
          <span className="products-filters-bar__label">Active Filters:</span>
          {activeCategory !== "All" && (
            <span className="products-filters-bar__tag">
              📁 {activeCategory}
              <button onClick={clearCategory}>✕</button>
            </span>
          )}
          {search && (
            <span className="products-filters-bar__tag">
              🔍 "{search}"
              <button onClick={clearSearch}>✕</button>
            </span>
          )}
          <button
            className="products-filters-bar__clear"
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
              setSearchParams({});
            }}
          >
            Clear All
          </button>
        </div>
      )}

      /* States */
      {loading && (
        <div className="products-state">
          <div className="products-spinner" />
          <p>Loading products…</p>
        </div>
      )}

      {error && (
        <div className="products-state">
          <p className="products-error">{error}</p>
          <button className="products-retry" onClick={fetchProducts}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="products-state">
          <div className="products-state__icon">🔍</div>
          <h3>No products found</h3>
          <p>
            {search && activeCategory !== "All"
              ? `No products match "${search}" in ${activeCategory}`
              : search
              ? `No products match "${search}"`
              : activeCategory !== "All"
              ? `No products in ${activeCategory}`
              : "No products available"}
          </p>
          <button
            className="products-retry"
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
              setSearchParams({});
            }}
          >
            Clear all filters
          </button>
        </div>
      )}

      /* Product Grid */
      {!loading && !error && filtered.length > 0 && (
        <div className="products-grid">
          {filtered.map((product) => {
            const imageUrl = getImageUrl(product);
            const inStock = product.stock > 0;
            const isUnavailable = !hasVendor(product);
            const isDisabled = !inStock || isUnavailable;

            return (
              <div key={product._id} className="product-card">
                <Link to={`/products/${product._id}`} className="product-card__image">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement?.querySelector('.product-card__fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="product-card__fallback"
                    style={{ display: imageUrl ? 'none' : 'flex' }}
                  >
                    {getCategoryEmoji(product.category)}
                  </div>
                  {!inStock && (
                    <span className="product-card__out-of-stock">Out of Stock</span>
                  )}
                </Link>

                <div className="product-card__content">
                  <div className="product-card__category">{product.category}</div>
                  <Link to={`/products/${product._id}`} className="product-card__name">
                    {product.name}
                  </Link>

                  <div className="product-card__price-row">
                    <span className="product-card__price">Rs {product.price?.toFixed(0)}</span>
                    {product.originalPrice && (
                      <span className="product-card__old-price">Rs {product.originalPrice?.toFixed(0)}</span>
                    )}
                    {product.rating && (
                      <span className="product-card__rating">★ {product.rating}</span>
                    )}
                  </div>

                  <div className="product-card__stock">
                    {inStock ? (
                      <span className="product-card__stock-in">In Stock: {product.stock}</span>
                    ) : (
                      <span className="product-card__stock-out">Out of Stock</span>
                    )}
                  </div>

                  <button
                    className={`product-card__btn ${isDisabled ? 'product-card__btn--disabled' : ''}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={isDisabled}
                  >
                    {!inStock ? 'Out of Stock' : isUnavailable ? 'Unavailable' : '🛒 Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;