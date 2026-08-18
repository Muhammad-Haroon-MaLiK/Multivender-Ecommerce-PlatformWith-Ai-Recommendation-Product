// AuthSuccess.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const AuthSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const userParam = params.get('user');
        
        console.log('🔑 Token received:', token);
        console.log('👤 User param:', userParam);

        if (token) {
            try {
                // Store token
                localStorage.setItem('token', token);
                
                // If user data is in URL, parse and store it
                if (userParam) {
                    try {
                        const user = JSON.parse(decodeURIComponent(userParam));
                        console.log('✅ User data from URL:', user);
                        localStorage.setItem('user', JSON.stringify(user));
                        
                        // Redirect user
                        setLoading(false);
                        if (user.role === 'admin') {
                            navigate('/admin/dashboard');
                        } else if (user.role === 'vendor') {
                            navigate('/vendor/dashboard');
                        } else {
                            navigate('/');
                        }
                    } catch (e) {
                        console.error('Failed to parse user data:', e);
                        // If parsing fails, fetch from API
                        fetchUserData(token);
                    }
                } else {
                    // No user data in URL, fetch from API
                    fetchUserData(token);
                }
            } catch (error) {
                console.error('Error processing auth:', error);
                setError('Failed to process authentication');
                setLoading(false);
            }
        } else {
            setError('No token received');
            setLoading(false);
            setTimeout(() => {
                navigate('/login?error=No token received');
            }, 2000);
        }
    }, [location, navigate]);

    const fetchUserData = async (token) => {
        try {
            console.log('📥 Fetching user data from API...');
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('📥 User data from API:', response.data);
            
            if (response.data.success) {
                const user = response.data.user;
                localStorage.setItem('user', JSON.stringify(user));
                setLoading(false);
                
                // Redirect based on role
                if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (user.role === 'vendor') {
                    navigate('/vendor/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                setError('Failed to fetch user data');
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            setError('Failed to fetch user data');
            setLoading(false);
            setTimeout(() => {
                navigate('/login?error=Failed to fetch user data');
            }, 2000);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2>Authenticating...</h2>
                    <p>Please wait while we log you in</p>
                    <div style={styles.spinner}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2>Authentication Error</h2>
                    <p style={{ color: 'red' }}>{error}</p>
                    <button 
                        onClick={() => navigate('/login')}
                        style={styles.button}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        minWidth: '300px'
    },
    spinner: {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        margin: '20px auto'
    },
    button: {
        backgroundColor: '#667eea',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px'
    }
};

// Add keyframes for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default AuthSuccess;