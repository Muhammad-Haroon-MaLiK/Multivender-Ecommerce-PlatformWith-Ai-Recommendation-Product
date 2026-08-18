import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VendorApproval.css';

const API_URL = 'http://localhost:5000/api';

const VendorApproval = () => {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [approvedVendors, setApprovedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all vendors
      const response = await axios.get(`${API_URL}/admin/vendors`, { headers });
      const allVendors = response.data.vendors || [];
      
      setPendingVendors(allVendors.filter(v => !v.vendorDetails?.isApproved));
      setApprovedVendors(allVendors.filter(v => v.vendorDetails?.isApproved));
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to approve this vendor?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/vendors/${vendorId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Vendor approved successfully!');
      fetchVendors();
    } catch (error) {
      alert('❌ Error approving vendor');
      console.error(error);
    }
  };

  const rejectVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to reject this vendor?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/vendors/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('❌ Vendor rejected and removed!');
      fetchVendors();
    } catch (error) {
      alert('❌ Error rejecting vendor');
      console.error(error);
    }
  };

  const filteredPending = pendingVendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendorDetails?.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApproved = approvedVendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading vendors...</div>;

  return (
    <div className="vendor-approval">
      <div className="approval-header">
        <h2>🏪 Vendor Management</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Pending Vendors Section */}
      <div className="vendors-section">
        <div className="section-header">
          <h3>⏳ Pending Approval ({filteredPending.length})</h3>
        </div>
        
        {filteredPending.length === 0 ? (
          <div className="empty-message">
            <p>✅ No vendors waiting for approval</p>
          </div>
        ) : (
          <div className="vendors-grid">
            {filteredPending.map(vendor => (
              <div key={vendor._id} className="vendor-card pending">
                <div className="vendor-header">
                  <div className="vendor-avatar">
                    {vendor.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="vendor-status pending">⏳ Pending</div>
                </div>
                <div className="vendor-info">
                  <h3>{vendor.name}</h3>
                  <p className="vendor-email">📧 {vendor.email}</p>
                  <p className="vendor-store">🏪 {vendor.vendorDetails?.storeName || 'No store name'}</p>
                  <p className="vendor-joined">📅 Joined: {new Date(vendor.createdAt).toLocaleDateString()}</p>
                  <p className="vendor-details">
                    <strong>Commission Rate:</strong> {vendor.vendorDetails?.commissionRate || 10}%
                  </p>
                </div>
                <div className="vendor-actions">
                  <button 
                    onClick={() => approveVendor(vendor._id)} 
                    className="approve-vendor-btn"
                  >
                    ✅ Approve Vendor
                  </button>
                  <button 
                    onClick={() => rejectVendor(vendor._id)} 
                    className="reject-vendor-btn"
                  >
                    ❌ Reject
                  </button>
                  <button 
                    onClick={() => setSelectedVendor(selectedVendor === vendor._id ? null : vendor._id)}
                    className="view-details-btn"
                  >
                    {selectedVendor === vendor._id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
                
                {/* Expanded Details */}
                {selectedVendor === vendor._id && (
                  <div className="vendor-details-expanded">
                    <h4>📋 Vendor Details</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Full Name:</span>
                        <span className="detail-value">{vendor.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{vendor.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Store Name:</span>
                        <span className="detail-value">{vendor.vendorDetails?.storeName || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Commission Rate:</span>
                        <span className="detail-value">{vendor.vendorDetails?.commissionRate || 10}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Joined Date:</span>
                        <span className="detail-value">{new Date(vendor.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Account Status:</span>
                        <span className="detail-value pending-status">Pending Approval</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Vendors Section */}
      <div className="vendors-section">
        <div className="section-header">
          <h3>✅ Approved Vendors ({filteredApproved.length})</h3>
        </div>
        
        {filteredApproved.length === 0 ? (
          <div className="empty-message">
            <p>No approved vendors yet</p>
          </div>
        ) : (
          <div className="vendors-grid">
            {filteredApproved.map(vendor => (
              <div key={vendor._id} className="vendor-card approved">
                <div className="vendor-header">
                  <div className="vendor-avatar">
                    {vendor.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="vendor-status approved">✅ Approved</div>
                </div>
                <div className="vendor-info">
                  <h3>{vendor.name}</h3>
                  <p className="vendor-email">📧 {vendor.email}</p>
                  <p className="vendor-store">🏪 {vendor.vendorDetails?.storeName}</p>
                  <p className="vendor-joined">📅 Joined: {new Date(vendor.createdAt).toLocaleDateString()}</p>
                  <p className="vendor-stats">
                    <span>📊 Products: {vendor.vendorDetails?.totalProducts || 0}</span>
                    <span>💰 Sales: ${vendor.vendorDetails?.totalSales || 0}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorApproval;