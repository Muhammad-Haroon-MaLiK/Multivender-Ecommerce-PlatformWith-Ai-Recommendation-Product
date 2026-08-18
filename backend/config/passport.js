const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

// Determine callback URL based on environment
const CALLBACK_URL = process.env.NODE_ENV === 'production' 
    ? `${process.env.BACKEND_URL}/api/auth/google/callback`
    : 'https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api](https://multivender-ecommerce-platformwith-ai-recommenda-production.up.railway.app/api/auth/google/callback';

console.log('🔑 Google OAuth Callback URL:', CALLBACK_URL);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['profile', 'email'],
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, cb) {
    try {
        console.log('📥 Google profile received:', profile.id);
        console.log('📧 Email:', profile.emails?.[0]?.value);
        console.log('👤 Name:', profile.displayName);
        
        if (!profile.id) {
            console.error('❌ No Google ID provided');
            return cb(new Error('No Google ID provided'), null);
        }

        // Find existing user or create new one
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            // Check if user exists with same email but no googleId
            const existingUser = await User.findOne({ 
                email: profile.emails?.[0]?.value 
            });
            
            if (existingUser) {
                // Link Google account to existing user
                console.log('📌 Linking Google account to existing user:', existingUser.email);
                existingUser.googleId = profile.id;
                existingUser.avatar = profile.photos?.[0]?.value || existingUser.avatar;
                existingUser.name = profile.displayName || existingUser.name;
                existingUser.isEmailVerified = true;
                user = await existingUser.save();
                console.log('✅ Google account linked successfully');
            } else {
                // Create new user
                console.log('📝 Creating new user from Google');
                user = new User({
                    googleId: profile.id,
                    email: profile.emails?.[0]?.value || '',
                    name: profile.displayName || profile.name?.givenName || 'User',
                    avatar: profile.photos?.[0]?.value || '',
                    isEmailVerified: true, // Google emails are verified
                    role: 'customer'
                });
                await user.save();
                console.log('✅ New user created successfully');
            }
        } else {
            // Update existing user's info
            console.log('🔄 Updating existing user:', user.email);
            user.email = profile.emails?.[0]?.value || user.email;
            user.avatar = profile.photos?.[0]?.value || user.avatar;
            user.name = profile.displayName || profile.name?.givenName || user.name;
            user.isEmailVerified = true;
            await user.save();
            console.log('✅ User updated successfully');
        }

        console.log('✅ Google authentication successful for:', user.email);
        return cb(null, user);
    } catch(err) {
        console.error('❌ Google Strategy Error:', err);
        return cb(err, null);
    }
  }
));

// Serialize user for session (if using sessions)
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session (if using sessions)
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;