import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const AdminProductApproval = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/products/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching pending products:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/products/${productId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Product approved successfully!');
      fetchPendingProducts();
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
      alert('❌ Product rejected');
      setSelectedProduct(null);
      setRejectionReason('');
      fetchPendingProducts();
    } catch (error) {
      alert('Error rejecting product');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading pending products...</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Products Pending Approval ({pendingProducts.length})</h2>
      
      {pendingProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p>No products pending approval</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {pendingProducts.map(product => (
            <div key={product._id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <div style={{ height: '200px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {product.images?.[0] ? (
                  <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '4rem' }}>📦</div>
                )}
              </div>
              <div style={{ padding: '1rem' }}>
                <h3>{product.name}</h3>
                <p style={{ color: '#666', margin: '0.5rem 0' }}>Vendor: {product.vendor?.name}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>${product.price}</p>
                <p style={{ color: '#888' }}>Category: {product.category}</p>
                <p style={{ color: '#888' }}>Stock: {product.stock}</p>
                <p style={{ marginTop: '0.5rem', color: '#555' }}>{product.description}</p>
              </div>
              <div style={{ padding: '1rem', background: '#f9f9f9', display: 'flex', gap: '1rem' }}>
                <button onClick={() => approveProduct(product._id)} style={{ flex: 1, padding: '0.5rem', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  ✅ Approve
                </button>
                <button onClick={() => setSelectedProduct(product)} style={{ flex: 1, padding: '0.5rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '90%' }}>
            <h3>Reject Product: {selectedProduct.name}</h3>
            <textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
              style={{ width: '100%', padding: '0.75rem', margin: '1rem 0', border: '1px solid #ddd', borderRadius: '8px' }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => rejectProduct(selectedProduct._id)} style={{ flex: 1, padding: '0.75rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Confirm Rejection
              </button>
              <button onClick={() => setSelectedProduct(null)} style={{ flex: 1, padding: '0.75rem', background: '#ccc', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductApproval;