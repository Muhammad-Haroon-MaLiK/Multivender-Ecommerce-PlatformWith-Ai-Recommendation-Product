import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserRoleManager.css';

const API_URL = 'http://localhost:5000/api';

const UserRoleManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/admin/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert(`✅ User role changed to ${newRole} successfully!`);
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Error changing user role');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin': return 'role-badge admin';
      case 'vendor': return 'role-badge vendor';
      default: return 'role-badge customer';
    }
  };

  return (
    <div className="user-role-manager">
      <div className="manager-header">
        <h2>User Role Management</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar-small">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name">{user.name}</div>
                        <div className="user-id">ID: {user._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="role-actions">
                      {user.role !== 'customer' && (
                        <button 
                          onClick={() => changeRole(user._id, 'customer')}
                          className="role-btn customer-btn"
                        >
                          Make Customer
                        </button>
                      )}
                      {user.role !== 'vendor' && (
                        <button 
                          onClick={() => changeRole(user._id, 'vendor')}
                          className="role-btn vendor-btn"
                        >
                          Make Vendor
                        </button>
                      )}
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => changeRole(user._id, 'admin')}
                          className="role-btn admin-btn"
                        >
                          Make Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserRoleManager;