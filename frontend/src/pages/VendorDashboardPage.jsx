import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VendorProductForm from '../components/VendorProductForm';
import './VendorDashboardPage.css';

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';
const BASE_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api';

const VendorDashboardPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [toast, setToast] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    rating: 4.8,
    pendingOrders: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      totalProducts: products.length,
      totalRevenue: products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0),
      totalEarnings: orders.reduce((sum, o) => sum + (o.vendorEarnings || 0), 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length
    }));
  }, [products, orders]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/vendor/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('❌ Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Orders fetched:', response.data);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // ✅ Handle Edit Product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
    setActiveTab('add');
  };

  // ✅ Handle Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/vendor/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      setProducts(prev => prev.filter(p => p._id !== productId));
      showToast('✅ Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('❌ Failed to delete product: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleProductAdded = () => {
    fetchProducts();
    setActiveTab('products');
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleCancelForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setActiveTab('products');
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/vendor/orders/status`, 
        { orderId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`✅ Order ${status} successfully!`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('❌ Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return { bg: '#48bb78', text: 'Delivered', icon: '✅' };
      case 'shipped': return { bg: '#4299e1', text: 'Shipped', icon: '🚚' };
      case 'processing': return { bg: '#ed8936', text: 'Processing', icon: '⚙️' };
      case 'confirmed': return { bg: '#38a169', text: 'Confirmed', icon: '✓' };
      case 'cancelled': return { bg: '#f56565', text: 'Cancelled', icon: '❌' };
      default: return { bg: '#a0aec0', text: 'Pending', icon: '⏳' };
    }
  };

  const getNextActions = (status) => {
    const actions = [];
    if (status === 'pending') actions.push({ label: 'Confirm Order', nextStatus: 'confirmed', color: '#38a169' });
    if (status === 'confirmed') actions.push({ label: 'Process Order', nextStatus: 'processing', color: '#4299e1' });
    if (status === 'processing') actions.push({ label: 'Ship Order', nextStatus: 'shipped', color: '#ed8936' });
    if (status === 'shipped') actions.push({ label: 'Mark Delivered', nextStatus: 'delivered', color: '#48bb78' });
    if (status !== 'delivered' && status !== 'cancelled') {
      actions.push({ label: 'Cancel Order', nextStatus: 'cancelled', color: '#f56565' });
    }
    return actions;
  };

  // ✅ Get image URL from item
  const getImageUrl = (item) => {
    if (!item) return null;
    
    if (item.image) {
      if (typeof item.image === 'string') {
        if (item.image.startsWith('http')) {
          return item.image;
        }
        if (item.image.startsWith('/')) {
          return `${BASE_URL}${item.image}`;
        }
        return `${BASE_URL}/uploads/${item.image}`;
      }
    }
    
    if (item.images && item.images.length > 0) {
      const img = item.images[0];
      if (typeof img === 'string') {
        if (img.startsWith('http')) return img;
        if (img.startsWith('/')) return `${BASE_URL}${img}`;
        return `${BASE_URL}/uploads/${img}`;
      } else if (img.url) {
        if (img.url.startsWith('http')) return img.url;
        if (img.url.startsWith('/')) return `${BASE_URL}${img.url}`;
        return `${BASE_URL}/uploads/${img.url}`;
      }
    }
    
    return null;
  };

  return (
    <div className="vendor-dashboard-container">
      {/* Toast Notification */}
      {toast && <div className="toast-message">{toast}</div>}

      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="vendor-welcome">
            <div className="vendor-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1>Welcome back, {user?.name}</h1>
              <p>Manage your products, track sales, and grow your business</p>
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-value">{stats.totalProducts}</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">{stats.pendingOrders}</span>
              <span className="stat-label">Pending Orders</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">Rs{stats.totalEarnings.toFixed(2)}</span>
              <span className="stat-label">Earnings</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">{stats.rating}★</span>
              <span className="stat-label">Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('products');
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        >
          📦 My Products
          <span className="tab-count">{products.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders');
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        >
          🛒 Orders ({orders.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('add');
            setShowProductForm(true);
            setEditingProduct(null);
          }}
        >
          ✨ Add New Product
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {activeTab === 'products' && (
          <div className="products-section">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛍️</div>
                <h3>No Products Yet</h3>
                <p>Start selling by adding your first product!</p>
                <button className="empty-add-btn" onClick={() => {
                  setActiveTab('add');
                  setShowProductForm(true);
                  setEditingProduct(null);
                }}>
                  + Add Your First Product
                </button>
              </div>
            ) : (
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => {
                      const imageUrl = getImageUrl(product);
                      return (
                        <tr key={product._id}>
                          <td className="product-cell">
                            <div className="product-info-cell">
                              <div className="product-thumb">
                                {imageUrl ? (
                                  <img 
                                    src={imageUrl} 
                                    alt={product.name} 
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = '<span style="font-size:28px;">📦</span>';
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontSize: '28px' }}>📦</span>
                                )}
                              </div>
                              <div>
                                <strong>{product.name}</strong>
                                <small>{product.description?.substring(0, 50)}...</small>
                              </div>
                            </div>
                          </td>
                          <td className="price-cell">Rs{product.price}</td>
                          <td>
                            <span className={`stock-badge ${product.stock > 10 ? 'high' : product.stock > 0 ? 'low' : 'out'}`}>
                              {product.stock} units
                            </span>
                          </td>
                          <td>
                            {product.isApproved ? (
                              <span className="status-badge approved">✅ Approved</span>
                            ) : (
                              <span className="status-badge pending">⏳ Pending</span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="edit-btn"
                                onClick={() => handleEditProduct(product)}
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                className="delete-btn"
                                onClick={() => handleDeleteProduct(product._id)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
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

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="orders-header">
              <h2>Customer Orders</h2>
              <p>Manage and track orders from your customers</p>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No Orders Yet</h3>
                <p>When customers order your products, they will appear here.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => {
                  const statusInfo = getStatusColor(order.status);
                  const actions = getNextActions(order.status);
                  const isExpanded = selectedOrder === order._id;
                  
                  return (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <div className="order-info">
                          <span className="order-number">#{order.orderNumber}</span>
                          <span className="order-date">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className="order-status" style={{ background: statusInfo.bg }}>
                            {statusInfo.icon} {statusInfo.text}
                          </span>
                        </div>
                        <div className="order-amount">
                          <span>Total: Rs{order.subtotal?.toFixed(2) || '0.00'}</span>
                          <span className="vendor-earnings">Your Earnings: Rs{order.vendorEarnings?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      <div className="order-items">
                        <h4>Items Ordered:</h4>
                        {order.items && order.items.map((item, idx) => {
                          let imageUrl = null;
                          
                          if (item.image) {
                            if (typeof item.image === 'string') {
                              if (item.image.startsWith('http')) {
                                imageUrl = item.image;
                              } else if (item.image.startsWith('/')) {
                                imageUrl = `${BASE_URL}${item.image}`;
                              } else {
                                imageUrl = `${BASE_URL}/uploads/${item.image}`;
                              }
                            }
                          }
                          
                          if (!imageUrl && item.productId) {
                            const product = products.find(p => p._id === item.productId);
                            if (product && product.images && product.images.length > 0) {
                              const img = product.images[0];
                              if (typeof img === 'string') {
                                if (img.startsWith('http')) {
                                  imageUrl = img;
                                } else if (img.startsWith('/')) {
                                  imageUrl = `${BASE_URL}${img}`;
                                } else {
                                  imageUrl = `${BASE_URL}/uploads/${img}`;
                                }
                              } else if (img.url) {
                                if (img.url.startsWith('http')) {
                                  imageUrl = img.url;
                                } else if (img.url.startsWith('/')) {
                                  imageUrl = `${BASE_URL}${img.url}`;
                                } else {
                                  imageUrl = `${BASE_URL}/uploads/${img.url}`;
                                }
                              }
                            }
                          }
                          
                          return (
                            <div key={idx} className="order-item">
                              <div className="order-item-image">
                                {imageUrl ? (
                                  <img 
                                    src={imageUrl} 
                                    alt={item.name} 
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = '<span style="font-size:24px;">📦</span>';
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontSize: '24px' }}>📦</span>
                                )}
                              </div>
                              <div className="order-item-details">
                                <span className="item-name">{item.name}</span>
                                <span className="item-qty">x {item.quantity}</span>
                              </div>
                              <span className="item-price">Rs{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="order-actions">
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => updateOrderStatus(order._id, action.nextStatus)}
                            className="order-action-btn"
                            style={{ background: action.color }}
                          >
                            {action.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setSelectedOrder(isExpanded ? null : order._id)}
                          className="order-action-btn"
                          style={{ background: '#4a5568' }}
                        >
                          {isExpanded ? 'Hide Customer Details' : 'View Customer Details'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="customer-details">
                          <h4>Customer Information</h4>
                          <div className="details-grid">
                            <div className="detail-row">
                              <span className="detail-label">Full Name:</span>
                              <span className="detail-value">{order.customer?.name}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Email:</span>
                              <span className="detail-value">{order.customer?.email}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Phone:</span>
                              <span className="detail-value">{order.customer?.phone}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Address:</span>
                              <span className="detail-value">
                                {order.customer?.address?.address}, {order.customer?.address?.city}, 
                                {order.customer?.address?.state} {order.customer?.address?.zipCode}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="add-product-section">
            <VendorProductForm 
              onProductAdded={handleProductAdded}
              editingProduct={editingProduct}
              onCancel={handleCancelForm}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboardPage;