import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProfilePage.css";

// Set base URL
const API_URL = 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

const ProfilePage = ({ user, handleLogout, setUser }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    zipCode: user?.address?.zipCode || "",
    country: user?.address?.country || "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || null);

  useEffect(() => {
    if (user?.avatar) {
      setAvatar(user.avatar);
    }
  }, [user]);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country || 'Pakistan'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        const updatedUser = {
          ...user,
          ...response.data.user
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (setUser) setUser(updatedUser);
        setIsEditing(false);
        showMessage('success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Update error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showMessage('error', 'Please upload a valid image (JPEG, PNG, GIF, or WEBP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image size should be less than 5MB');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/auth/upload-avatar`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        const avatarUrl = response.data.avatar;
        setAvatar(avatarUrl);
        
        const updatedUser = {
          ...user,
          avatar: avatarUrl
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (setUser) setUser(updatedUser);
        showMessage('success', 'Profile image updated successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        showMessage('success', 'Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Password error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tabName) => {
    if (tabName === 'orders') {
      navigate('/orders');
    } else if (tabName === 'wishlist') {
      navigate('/wishlist');
    } else {
      setTab(tabName);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <h3>Please Login</h3>
            <p>You need to be logged in to view your profile.</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile_header">
          <h1>My Account</h1>
          <p>Manage your profile, orders, and settings</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-card">
              <div className="profile-avatar-wrapper">
                {avatar ? (
                  <img 
                    src={`https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api${avatar}`} 
                    alt="Profile" 
                    className="profile-avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('.profile-avatar').style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="profile-avatar" style={{ display: avatar ? 'none' : 'flex' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button 
                  className="avatar-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Upload profile picture"
                >
                  {uploading ? '⏳' : '📷'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="profile-name">{user?.name || "User"}</div>
              <div className="profile-email">{user?.email || "user@example.com"}</div>
              <div className="profile-role">
                <span className="role-badge">{user?.role || 'Customer'}</span>
              </div>

              <div className="profile-menu">
                <button 
                  className={`menu-item ${tab === 'profile' ? 'active' : ''}`}
                  onClick={() => setTab('profile')}
                >
                  <span>👤</span> My Profile
                </button>
                <button 
                  className={`menu-item ${tab === 'orders' ? 'active' : ''}`}
                  onClick={() => handleTabClick('orders')}
                >
                  <span>📦</span> My Orders
                </button>
                <button 
                  className={`menu-item ${tab === 'wishlist' ? 'active' : ''}`}
                  onClick={() => handleTabClick('wishlist')}
                >
                  <span>❤️</span> Wishlist
                </button>
              </div>

              <button className="logout-btn" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-content">
            <div className="profile-card-main">
              <div className="profile-tabs">
                <button 
                  className={`tab-btn ${tab === 'profile' ? 'active' : ''}`}
                  onClick={() => setTab('profile')}
                >
                  Profile
                </button>
                <button 
                  className={`tab-btn ${tab === 'security' ? 'active' : ''}`}
                  onClick={() => setTab('security')}
                >
                  Security
                </button>
              </div>

              {tab === 'profile' && (
                <form className="profile-form" onSubmit={handleProfileUpdate}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        className="form-input"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        className="form-input"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      disabled
                    />
                    <small className="form-hint">Email cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+92 300-1234567"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-input"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House #, Street, Area"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        className="form-input"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="form-group">
                      <label>State/Province</label>
                      <input
                        type="text"
                        name="state"
                        className="form-input"
                        value={formData.state}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        className="form-input"
                        value={formData.zipCode}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        name="country"
                        className="form-input"
                        value={formData.country}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    {isEditing ? (
                      <>
                        <button 
                          type="submit" 
                          className="btn-primary"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button 
                          type="button"
                          className="btn-secondary" 
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button"
                        className="btn-primary" 
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </form>
              )}

              {tab === 'security' && (
                <form className="profile-form" onSubmit={handlePasswordUpdate}>
                  <div className="security-info">
                    <p>Change your password to keep your account secure.</p>
                  </div>

                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      className="form-input"
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      className="form-input"
                      placeholder="Enter new password (min 6 characters)"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-input"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;