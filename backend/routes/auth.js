const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { 
    registerUser, 
    loginUser, 
    getMe, 
    getProfile,
    updateProfile,
    verifyEmail,
    resendVerificationEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
    forgotPassword,
    resetPassword,
    resendOTP
} = require('../controllers/passwordController');
const User = require('../models/User');

const router = express.Router();

// Ensure upload directories exist 
const uploadsDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(__dirname, '../uploads/avatars');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configure Multer for Avatar Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

// Test Route 
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Auth routes are working!',
        endpoints: {
            google: '/api/auth/google',
            googleCallback: '/api/auth/google/callback',
            register: '/api/auth/register (POST)',
            login: '/api/auth/login (POST)',
            me: '/api/auth/me (GET)',
            profile: '/api/auth/profile (GET)',
            update: '/api/auth/update (PUT)',
            uploadAvatar: '/api/auth/upload-avatar (POST)',
            changePassword: '/api/auth/change-password (POST)',
            forgotPassword: '/api/auth/forgot-password (POST)',
            resetPassword: '/api/auth/reset-password (POST)',
            resendOTP: '/api/auth/resend-otp (POST)',
            logout: '/api/auth/logout (POST)'
        }
    });
});

// Google OAuth 
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false,
        prompt: 'select_account'
    })
);

router.get('/google/callback', 
    (req, res, next) => {
        console.log('📥 Google callback received');
        console.log('📋 Query params:', req.query);
        next();
    },
    passport.authenticate('google', { 
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Google authentication failed`,
        session: false
    }), 
    async (req, res) => {
        try {
            console.log('✅ User authenticated successfully');
            
            if (!req.user) {
                const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                return res.redirect(`${frontendUrl}/login?error=No user found`);
            }
            
            const token = jwt.sign(
                { 
                    id: req.user._id,
                    email: req.user.email,
                    role: req.user.role || 'customer',
                    isEmailVerified: req.user.isEmailVerified || false
                }, 
                process.env.JWT_SECRET, 
                { expiresIn: "7d" }
            );
            
            const userData = {
                id: req.user._id,
                name: req.user.name || 'User',
                email: req.user.email,
                avatar: req.user.avatar || '',
                role: req.user.role || 'customer',
                googleId: req.user.googleId || null,
                isEmailVerified: req.user.isEmailVerified || false,
                isGoogleAccount: true
            };
            
            const encodedUserData = encodeURIComponent(JSON.stringify(userData));
            const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
            const redirectUrl = `${frontendUrl}/auth/success?token=${token}&user=${encodedUserData}`;
            
            console.log('🔄 Redirecting to:', redirectUrl);
            res.redirect(redirectUrl);
            
        } catch(err) {   
            console.error("❌ Google login error:", err);
            const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/login?error=Google authentication failed`);
        }
    }
);

// Avatar Upload Route 
router.post('/upload-avatar', protect, upload.single('avatar'), async (req, res) => {
    try {
        console.log('📸 Avatar upload request received');
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image file'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete old avatar if exists
        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, '..', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
                console.log('🗑️ Old avatar deleted');
            }
        }

        // Save avatar URL
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        user.avatar = avatarUrl;
        await user.save();

        console.log(`✅ Avatar uploaded for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Profile image updated successfully',
            avatar: avatarUrl
        });
    } catch (error) {
        console.error('❌ Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image'
        });
    }
});

// Change Password Route
router.post('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All password fields are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has password (not Google OAuth user)
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: 'This account uses Google authentication. Password change is not available.'
            });
        }

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update Profile Route 
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) {
            user.address = {
                street: address.street || user.address?.street || '',
                city: address.city || user.address?.city || '',
                state: address.state || user.address?.state || '',
                zipCode: address.zipCode || user.address?.zipCode || '',
                country: address.country || user.address?.country || 'Pakistan'
            };
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role,
                address: user.address
            }
        });
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Auth Routes 
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOTP);
router.get('/me', protect, getMe);
router.get('/profile', protect, getProfile);
router.put('/update', protect, updateProfile);
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;