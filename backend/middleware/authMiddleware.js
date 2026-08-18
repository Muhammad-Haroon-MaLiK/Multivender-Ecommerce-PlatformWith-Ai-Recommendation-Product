const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token
const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }
            
            next();
        } catch (error) {
            console.error('Auth error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Authorize based on roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Role ${req.user.role} is not authorized to access this route` 
            });
        }
        next();
    };
};

// Check if vendor is approved
const isVendorApproved = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role === 'vendor' && user.vendorDetails && !user.vendorDetails.isApproved) {
            return res.status(403).json({ 
                message: 'Your vendor account is pending approval. Please wait for admin approval.' 
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Optional authentication - doesn't block if no token
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (user) req.user = user;
        }
        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};

module.exports = { protect, authorize, optionalAuth, isVendorApproved };