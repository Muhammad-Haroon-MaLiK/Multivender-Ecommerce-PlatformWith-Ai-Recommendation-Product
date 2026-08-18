import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VendorsPage.css';

const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const VendorsPage = ({ setPage }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API_URL}/vendors`);
      setVendors(response.data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendorDetails?.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="vendors-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vendors-page">
      <div className="vendors-header">
        <h1>🏪 All Vendors</h1>
        <p>Discover verified vendors and their products</p>
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search vendors by name, store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="vendors-stats">
        <span>Total Vendors: {vendors.length}</span>
        <span>Showing: {filteredVendors.length}</span>
      </div>

      {filteredVendors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏪</div>
          <h3>No Vendors Found</h3>
          <p>Try adjusting your search or check back later</p>
        </div>
      ) : (
        <div className="vendors-grid">
          {filteredVendors.map((vendor) => (
            <div key={vendor._id} className="vendor-card">
              <div className="vendor-header">
                <div className="vendor-avatar">
                  {vendor.vendorDetails?.storeLogo || vendor.name?.charAt(0).toUpperCase() || '🏪'}
                </div>
                <div className="vendor-badge">✓ Verified</div>
              </div>
              <div className="vendor-body">
                <h3>{vendor.vendorDetails?.storeName || vendor.name}</h3>
                <p className="vendor-name">{vendor.name}</p>
                <p className="vendor-email">{vendor.email}</p>
                <div className="vendor-meta">
                  <span>📦 {vendor.vendorDetails?.totalProducts || 0} Products</span>
                  <span>💰 Sales: Rs{vendor.vendorDetails?.totalSales || 0}</span>
                </div>
                <div className="vendor-rating">
                  <span className="stars">★★★★★</span>
                  <span className="rating">4.8</span>
                </div>
                <button 
                  className="view-products-btn"
                  onClick={() => setPage('products')}
                >
                  View Products →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorsPage;