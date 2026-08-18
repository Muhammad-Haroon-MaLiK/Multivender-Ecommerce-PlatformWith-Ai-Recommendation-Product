
const API_BASE = 'http://https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/api';

function getSessionId() {
  let sid = localStorage.getItem('sv_session_id');
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    localStorage.setItem('sv_session_id', sid);
  }
  return sid;
}

function getAuthToken() {
  // Try the plain key first...
  const direct = localStorage.getItem('token');
  if (direct && direct !== 'null' && direct !== 'undefined') return direct;

  // ...then fall back to a `user` object that carries the token inside it
  try {
    const user = JSON.parse(localStorage.getItem('marketHubUser') || 'null');
    return user?.token || null;
  } catch {
    return null;
  }
}

async function track(productId, eventType) {
  try {
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    await fetch(`${API_BASE}/recommendations/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ 
        productId, 
        eventType, 
        sessionId: getSessionId() 
      }),
    });
  } catch (err) {
    // tracking should never break the UI — swallow errors, just log
    console.warn('Tracking failed:', err);
  }
}

export const trackView = (productId) => track(productId, 'view');
export const trackAddToCart = (productId) => track(productId, 'add_to_cart');
export const trackWishlist = (productId) => track(productId, 'wishlist');
export const trackPurchase = (productId) => track(productId, 'purchase');

export async function getRecommendationFeed(limit = 12) {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const isLoggedIn = !!token;
  const url = isLoggedIn
    ? `${API_BASE}/recommendations?limit=${limit}`
    : `${API_BASE}/recommendations/trending?limit=${limit}`;

  try {
    const res = await fetch(url, { headers });
    
    if (!res.ok) {
      // Token exists but server rejected it (expired/invalid) — fall back to
      // trending instead of surfacing a broken "No recommendations yet" state.
      if (res.status === 401) {
        const fallbackRes = await fetch(`${API_BASE}/recommendations/trending?limit=${limit}`);
        if (!fallbackRes.ok) {
          throw new Error(`HTTP error! status: ${fallbackRes.status}`);
        }
        return fallbackRes.json();
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Normalize response to always have { source, items }
    // Handle both formats: direct array or { products: [] }
    if (data.items) {
      return data;
    } else if (data.products) {
      return { 
        source: 'trending', 
        items: data.products.map(p => ({ product: p, score: 0 })) 
      };
    } else if (Array.isArray(data)) {
      return { 
        source: 'trending', 
        items: data.map(p => ({ product: p, score: 0 })) 
      };
    } else if (data.recommendations) {
      return { 
        source: 'personalized', 
        items: data.recommendations.map(r => ({ 
          product: r, 
          score: r.recommendation_score || 0 
        })) 
      };
    }
    
    // Fallback: return empty
    return { source: 'empty', items: [] };
    
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    // Return empty array to prevent UI crash
    return { source: 'error', items: [] };
  }
}