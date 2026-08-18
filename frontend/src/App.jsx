import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { CartProvider, useCart } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useState, useEffect } from "react";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import OrderConfirmPage from "./pages/OrderConfirmPage";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentProcessingPage from "./pages/PaymentProcessingPage";
import VendorsPage from "./pages/VendorsPage";
import VendorStorePage from "./pages/VendorStorePage";
import VendorDashboardPage from "./pages/VendorDashboardPage";
import VendorOrdersPage from "./pages/VendorOrdersPage";
import AdminDashboard from "./pages/AdminDashboard";
import "./styles/theme.css";
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AuthSuccess from './pages/AuthSuccess';
import ContactUsPage from "./pages/ContactUsPage";
import HelpPage from "./pages/HelpPage";

const AppContent = () => {
  const navigate = useNavigate();
  const { cartItems, wishlistItems } = useCart();
  const { user, logout, isAuthenticated, isVendor, isAdmin } = useAuth();
  
  const cartCount = cartItems?.reduce((total, item) => total + (item.quantity || 1), 0) || 0;
  const wishlistCount = wishlistItems?.length || 0;

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <Nav 
        cartCount={cartCount} 
        wishlistCount={wishlistCount}
        user={user}
        handleLogout={handleLogout}
        isVendor={isVendor}
        isAdmin={isAdmin}
      />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vendor/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/success" element={<AuthSuccess />} />

          {/* Product Routes */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          
          {/* Cart & Checkout Routes */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment" element={<PaymentProcessingPage />} />
          <Route path="/order-confirm" element={<OrderConfirmPage />} />
          
          {/* Order Routes */}
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          
          {/* User Routes */}
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                user={user} 
                handleLogout={handleLogout}
              />
            } 
          />
          <Route path="/wishlist" element={<WishlistPage />} />
          
          {/* Vendor Routes */}
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/vendors/:id" element={<VendorStorePage />} />
          <Route 
            path="/vendor/dashboard" 
            element={
              <VendorDashboardPage user={user} />
            } 
          />
          <Route path="/vendor/orders" element={<VendorOrdersPage />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminDashboard user={user} />
            } 
          />

          {/* ✅ Add Help & Contact Routes */}
          <Route path="/help" element={<HelpPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          
          {/* Fallback Route - 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

// Simple 404 Page Component
const NotFoundPage = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        background: '#fff',
        padding: '4rem 2rem',
        borderRadius: '12px',
        maxWidth: '500px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid #e8e8e8'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '1rem' }}>404</div>
        <h2 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>Page Not Found</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(102,126,234,0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;