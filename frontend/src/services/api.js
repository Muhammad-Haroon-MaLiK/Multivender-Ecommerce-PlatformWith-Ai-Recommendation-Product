// Update the API service to work with new backend
// FIXED: Removed /api from the base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

const getAuthToken = () => {
  // In development, don't require a token
  if (isDevelopment) {
    return null;
  }
  return localStorage.getItem('marketHubToken');
};

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Skip 401 redirect in development
    if (response.status === 401 && !isDevelopment) {
      localStorage.removeItem('marketHubToken');
      localStorage.removeItem('marketHubUser');
      window.location.href = '/login';
    }
    // Don't throw error for 401 in development
    if (response.status === 401 && isDevelopment) {
      console.warn('Development mode: Ignoring 401 error');
      return data || {};
    }
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
};

// Helper to get headers
const getHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  
  // Only add auth token if not in development
  if (!includeAuth) {
    return headers;
  }

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {
  // Auth endpoints
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },
  
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },
  
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },
  
  // Product endpoints
  getProducts: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/api/products${queryParams ? `?${queryParams}` : ''}`, {
      headers: getHeaders(false), // No auth needed for products
    });
    return handleResponse(response);
  },
  
  getProduct: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      headers: getHeaders(false),
    });
    return handleResponse(response);
  },
  
  createProduct: async (productData) => {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  },
  
  // Cart endpoints
  getCart: async () => {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  addToCart: async (productId, quantity = 1) => {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });
    return handleResponse(response);
  },
  
  removeFromCart: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/api/cart/${productId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  // Order endpoints
  createOrder: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  },
  
  getMyOrders: async () => {
    const response = await fetch(`${API_BASE_URL}/api/orders/myorders`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
  
  // Vendor endpoints
  getVendorStats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/vendor/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};