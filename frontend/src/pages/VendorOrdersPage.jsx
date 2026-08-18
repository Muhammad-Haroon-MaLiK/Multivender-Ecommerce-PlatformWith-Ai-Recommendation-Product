import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const VendorOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData = response.data.orders || [];
      setOrders(ordersData);
      
      // Calculate stats
      const newStats = {
        total: ordersData.length,
        pending: ordersData.filter(o => o.status === 'pending').length,
        confirmed: ordersData.filter(o => o.status === 'confirmed').length,
        processing: ordersData.filter(o => o.status === 'processing').length,
        shipped: ordersData.filter(o => o.status === 'shipped').length,
        delivered: ordersData.filter(o => o.status === 'delivered').length,
        cancelled: ordersData.filter(o => o.status === 'cancelled').length,
        totalEarnings: ordersData.reduce((sum, o) => sum + (o.vendorEarnings || 0), 0)
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/vendor/orders/status`, 
        { orderId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Order ${status} successfully!`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading orders...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 style={{ marginBottom: '10px' }}>Vendor Orders</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>Manage and track your orders</p>
      
      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>📦</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>{stats.total}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Orders</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>⏳</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ed8936' }}>{stats.pending}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Pending</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>✅</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#48bb78' }}>{stats.delivered}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Delivered</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>💰</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#48bb78' }}>
            ${stats.totalEarnings.toFixed(2)}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Earnings</div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px' }}>
          <p>No orders yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Items</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Total</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Your Earnings</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const statusInfo = getStatusColor(order.status);
                const actions = getNextActions(order.status);
                return (
                  <tr key={order._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{order.orderNumber}</td>
                    <td style={{ padding: '15px', color: '#666' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '15px' }}>
                      <div><strong>{order.customer?.name}</strong></div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{order.customer?.phone}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '14px' }}>
                          {item.name} x {item.quantity}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>${order.subtotal?.toFixed(2)}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#48bb78' }}>${order.vendorEarnings?.toFixed(2)}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        background: statusInfo.bg,
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => updateOrderStatus(order._id, action.nextStatus)}
                            style={{
                              padding: '6px 12px',
                              background: action.color,
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {action.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setSelectedOrder(selectedOrder === order._id ? null : order._id)}
                          style={{
                            padding: '6px 12px',
                            background: '#4a5568',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {selectedOrder === order._id ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                      {selectedOrder === order._id && (
                        <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                          <h4 style={{ margin: '0 0 10px 0' }}>Customer Details</h4>
                          <p style={{ margin: '5px 0' }}><strong>Name:</strong> {order.customer?.name}</p>
                          <p style={{ margin: '5px 0' }}><strong>Email:</strong> {order.customer?.email}</p>
                          <p style={{ margin: '5px 0' }}><strong>Phone:</strong> {order.customer?.phone}</p>
                          <p style={{ margin: '5px 0' }}><strong>Address:</strong> {order.customer?.address?.address}, {order.customer?.address?.city}, {order.customer?.address?.state} {order.customer?.address?.zipCode}</p>
                        </div>
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
  );
};

export default VendorOrdersPage;