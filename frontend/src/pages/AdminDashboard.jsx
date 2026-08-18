// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserRoleManager from '../components/UserRoleManager';
import VendorApproval from '../components/VendorApproval';
import './AdminDashboard.css';

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const AdminDashboard = ({ user, setPage }) => {
  const [activeTab, setActiveTab] = useState('vendors');
  const [pendingVendors, setPendingVendors] = useState([]);
  const [approvedVendors, setApprovedVendors] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVendors: 0,
    approvedVendors: 0,
    pendingVendors: 0,
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    totalRevenue: 0
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all vendors
      const allVendorsRes = await axios.get(`${API_URL}/admin/vendors`, { headers });
      const allVendors = allVendorsRes.data.vendors || [];
      const pending = allVendors.filter(v => !v.vendorDetails?.isApproved);
      const approved = allVendors.filter(v => v.vendorDetails?.isApproved);
      
      setPendingVendors(pending);
      setApprovedVendors(approved);

      // Fetch pending products
      const pendingProductsRes = await axios.get(`${API_URL}/admin/products/pending`, { headers });
      setPendingProducts(pendingProductsRes.data.products || []);

      // Fetch all products
      const allProductsRes = await axios.get(`${API_URL}/admin/products/all`, { headers });
      setAllProducts(allProductsRes.data.products || []);

      // Fetch stats
      const statsRes = await axios.get(`${API_URL}/admin/stats`, { headers });
      setStats({
        totalVendors: allVendors.length,
        approvedVendors: approved.length,
        pendingVendors: pending.length,
        totalProducts: allProductsRes.data.products?.length || 0,
        approvedProducts: (allProductsRes.data.products?.filter(p => p.isApproved) || []).length,
        pendingProducts: pendingProductsRes.data.products?.length || 0,
        totalRevenue: statsRes.data.totalRevenue || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get image URL
  const getImageUrl = (product) => {
    if (!product) return null;
    
    // Check if images array exists
    if (product.images && product.images.length > 0) {
      const img = product.images[0];
      // If it's a string
      if (typeof img === 'string') {
        return img.startsWith('http') ? img : `${API_URL.replace('/api', '')}${img}`;
      }
      // If it's an object with url property
      if (img.url) {
        return img.url.startsWith('http') ? img.url : `${API_URL.replace('/api', '')}${img.url}`;
      }
    }
    
    // Check if image property exists
    if (product.image) {
      return product.image.startsWith('http') ? product.image : `${API_URL.replace('/api', '')}${product.image}`;
    }
    
    return null;
  };

  const approveProduct = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/products/${productId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Product approved successfully!');
      fetchData();
    } catch (error) {
      alert('Error approving product');
    }
  };

  const rejectProduct = async (productId) => {
    if (!rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/products/${productId}/reject`, 
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Product rejected');
      setSelectedProduct(null);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      alert('Error rejecting product');
    }
  };

  const filteredProducts = (products) => {
    if (!searchTerm) return products;
    return products.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage vendors, approve products, and monitor platform activity</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">🏪</div>
          <div className="stat-info">
            <h3>{stats.totalVendors}</h3>
            <p>Total Vendors</p>
            <small>{stats.approvedVendors} approved, {stats.pendingVendors} pending</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
            <small>{stats.approvedProducts} approved, {stats.pendingProducts} pending</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>${stats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      // Search Bar - Only show for product tabs 
      {(activeTab === 'products' || activeTab === 'all-products') && (
        <div className="admin-search">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      // Tabs 
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'vendors' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendors')}
        >
          🏪 Vendor Management ({pendingVendors.length} pending)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Product Approvals ({pendingProducts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'all-products' ? 'active' : ''}`}
          onClick={() => setActiveTab('all-products')}
        >
          📋 All Products ({allProducts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Manage Users
        </button>
      </div>

      // Content
      <div className="admin-content">

        // Vendor Management Tab - Using VendorApproval Component
        {activeTab === 'vendors' && (
          <VendorApproval />
        )}

        // Product Approvals Tab
        {activeTab === 'products' && (
          <div className="products-section">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : filteredProducts(pendingProducts).length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No Pending Products</h3>
                <p>All products have been reviewed!</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts(pendingProducts).map(product => {
                  const imageUrl = getImageUrl(product);
                  
                  return (
                    <div key={product._id} className="product-card">
                      <div className="product-image">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} />
                        ) : (
                          <div className="no-image">📦</div>
                        )}
                        <div className="product-badge pending">Pending Review</div>
                      </div>
                      <div className="product-details">
                        <h3>{product.name}</h3>
                        <p className="vendor-name">👤 Vendor: {product.vendor?.name || 'Unknown'}</p>
                        <div className="product-price">${product.price}</div>
                        <div className="product-meta">
                          <span>📁 {product.category}</span>
                          <span>📊 Stock: {product.stock}</span>
                        </div>
                        <p className="product-description">{product.description}</p>
                      </div>
                      <div className="product-actions">
                        <button onClick={() => approveProduct(product._id)} className="approve-btn">
                          ✅ Approve
                        </button>
                        <button onClick={() => setSelectedProduct(product)} className="reject-btn">
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        // All Products Tab
        {activeTab === 'all-products' && (
          <div className="products-section">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : filteredProducts(allProducts).length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No Products</h3>
                <p>No products have been added yet.</p>
              </div>
            ) : (
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Vendor</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts(allProducts).map(product => {
                      const imageUrl = getImageUrl(product);
                      
                      return (
                        <tr key={product._id}>
                          <td>
                            <div className="product-cell">
                              <div className="product-thumb">
                                {imageUrl ? (
                                  <img src={imageUrl} alt={product.name} />
                                ) : (
                                  <span>📦</span>
                                )}
                              </div>
                              <div>
                                <strong>{product.name}</strong>
                                <small>{product.category}</small>
                              </div>
                            </div>
                          </td>
                          <td>{product.vendor?.name || 'Unknown'}</td>
                          <td>${product.price}</td>
                          <td>{product.stock}</td>
                          <td>
                            {product.isApproved ? (
                              <span className="status-approved">✅ Approved</span>
                            ) : (
                              <span className="status-pending">⏳ Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        // Users Management Tab
        {activeTab === 'users' && (
          <UserRoleManager />
        )}
      </div>

      // Rejection Modal
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Product: {selectedProduct.name}</h3>
            <textarea
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
            />
            <div className="modal-buttons">
              <button onClick={() => rejectProduct(selectedProduct._id)} className="confirm-reject">
                Confirm Rejection
              </button>
              <button onClick={() => setSelectedProduct(null)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;