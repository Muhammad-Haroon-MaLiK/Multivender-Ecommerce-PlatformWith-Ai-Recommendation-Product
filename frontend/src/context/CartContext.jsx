import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('shopverse_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        setCartItems([]);
      }
    }
    
    const savedWishlist = localStorage.getItem('shopverse_wishlist');
    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (e) {
        setWishlistItems([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shopverse_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shopverse_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Add to cart - FIXED: Better image handling
  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    
    // Get vendor ID from multiple possible sources
    const vendorId = product.vendorId || 
                     product.vendor?._id || 
                     product.vendor?.id || 
                     product._vendorId ||
                     null;

    // Get product ID from multiple possible sources
    const productId = product._id || product.id || product.productId || null;

    if (!productId) {
      console.error('❌ Product has no ID:', product);
      return;
    }

    // Get category - check multiple possible sources
    const category = product.category || 
                     product.categoryName || 
                     product.categoryId || 
                     'Uncategorized';

    // Get image - check multiple possible sources
    let image = product.image || null;
    if (!image && product.images && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        image = img;
      } else if (img && typeof img === 'object' && img.url) {
        image = img.url;
      }
    }

    console.log('🛒 Adding to cart:', { 
      productId, 
      vendorId, 
      name: product.name, 
      category,
      image: image 
    });

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        (item._id || item.id) === productId
      );
      
      if (existingItem) {
        return prevItems.map(item =>
          (item._id || item.id) === productId
            ? { ...item, quantity: (item.quantity || 0) + quantity }
            : item
        );
      } else {
        return [...prevItems, {
          _id: productId,
          id: productId,
          productId: productId,
          name: product.name || 'Product',
          price: product.price || 0,
          quantity: quantity || 1,
          category: category,
          vendorId: vendorId,
          vendor: product.vendor,
          vendorName: product.vendor?.vendorDetails?.storeName || product.vendor?.name || 'Vendor',
          image: image, 
          images: product.images || [],
          stock: product.stock || 0,
          discountedPrice: product.discountedPrice || null,
          description: product.description || '',
          rating: product.rating || 0,
          color: product.color || null,
          size: product.size || null
        }];
      }
    });
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => 
      (item._id || item.id) !== productId
    ));
  };

  // Update quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems => prevItems.map(item =>
      (item._id || item.id) === productId
        ? { ...item, quantity: quantity }
        : item
    ));
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get cart total
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Wishlist functions
  const addToWishlist = (product) => {
    if (!product) return;
    
    const productId = product._id || product.id || product.productId;
    if (!productId) return;
    
    const exists = wishlistItems.some(item => (item._id || item.id) === productId);
    if (!exists) {
      setWishlistItems([...wishlistItems, product]);
    }
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems(prevItems => prevItems.filter(item => 
      (item._id || item.id) !== productId
    ));
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => (item._id || item.id) === productId);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      wishlistItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      addToWishlist,
      removeFromWishlist,
      isInWishlist
    }}>
      {children}
    </CartContext.Provider>
  );
};