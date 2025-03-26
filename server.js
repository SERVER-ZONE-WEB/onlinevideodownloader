const express = require('express');
const youtubedl = require('youtube-dl-exec');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const securityPatches = require('./security-patches');
const app = express();

// Security Middlewares
app.use(helmet()); // Security headers
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Apply security patches
securityPatches(app);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Secure JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_PASSWORD = 'admin123'; // For admin access

// Auth middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    const adminAuth = req.headers['admin-auth'];

    // Check for admin access first
    if (adminAuth === ADMIN_PASSWORD) {
        req.user = { isAuthenticated: true, isAdmin: true };
        return next();
    }

    // Check for regular user auth
    if (!token) {
        req.user = { isAuthenticated: false, isAdmin: false };
        return next();
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        // Check if user has active premium subscription
        const hasPremium = checkPremiumStatus(decoded.email); // You'll need to implement this
        req.user = { 
            isAuthenticated: true, 
            isAdmin: false,
            hasPremium,
            ...decoded 
        };
        next();
    } catch (err) {
        req.user = { isAuthenticated: false, isAdmin: false };
        next();
    }
};

// Enable CORS for all origins
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Add passport middleware
app.use(passport.initialize());

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    // Handle Google auth
    const token = jwt.sign({ email: profile.emails[0].value }, JWT_SECRET);
    done(null, { token });
}));

// Configure Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: 'YOUR_FACEBOOK_APP_ID',
    clientSecret: 'YOUR_FACEBOOK_APP_SECRET',
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
    // Handle Facebook auth
    const token = jwt.sign({ email: profile.emails[0].value }, JWT_SECRET);
    done(null, { token });
}));

// Add login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    // Add your authentication logic here
    // For demo, using simple check
    if (email && password) {
        const token = jwt.sign({ email }, JWT_SECRET);
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Add platform validation endpoint
app.post('/api/validate', (req, res) => {
    const { url } = req.body;
    const platform = getPlatformFromUrl(url);
    res.json({ platform, valid: !!platform });
});

function getPlatformFromUrl(url) {
    if (!url) return null;
    if (url.includes('youtube.com/') || url.includes('youtu.be/')) return 'youtube';
    if (url.includes('instagram.com/')) return 'instagram';
    if (url.includes('facebook.com/') || url.includes('fb.watch/')) return 'facebook';
    if (url.includes('threads.net/')) return 'threads';
    return null;
}

// Admin download endpoint
app.post('/api/admin/download', (req, res) => {
    const adminAuth = req.headers['admin-auth'];
    if (adminAuth !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Process download with full quality access
    handleDownload(req, res, true);
});

// Regular download endpoint
app.post('/api/download', authMiddleware, (req, res) => {
    handleDownload(req, res, req.user.isAuthenticated);
});

// Shared download handling function
async function handleDownload(req, res, hasFullAccess) {
    try {
        const { url, platform, contentType } = req.body;
        
        // Check if user has premium or is admin for HD quality
        const canAccessHD = req.user.isAdmin || req.user.hasPremium;
        
        let options = {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
            extractAudio: false
        };

        // Platform specific options
        switch (platform) {
            case 'youtube':
                if (url.includes('shorts')) {
                    options.format = hasFullAccess ? 'best' : 'best[height<=480]';
                } else if (url.includes('live')) {
                    options.format = 'best';
                } else {
                    options.format = hasFullAccess ? 
                        'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best' : 
                        'worstvideo[height<=480]+worstaudio/worst';
                }
                break;
                
            case 'instagram':
                options.format = hasFullAccess ? 'best' : 'worst[height<=480]';
                if (contentType === 'story' || contentType === 'reel') {
                    options.addHeader = ['Cookie:sessionid=YOUR_SESSION_ID'];
                }
                break;
                
            case 'facebook':
                options.format = hasFullAccess ? 
                    'best[ext=mp4]/best' : 
                    'worst[height<=480][ext=mp4]/worst';
                break;
                
            case 'threads':
                options.format = hasFullAccess ? 'best' : 'worst[height<=480]';
                break;
                
            default:
                throw new Error('Unsupported platform');
        }

        // Add support for more formats
        options.format = getFormatString(platform, contentType, hasFullAccess);
        options.writesubtitles = true;
        options.writedescription = true;

        console.log(`Processing ${platform} ${contentType}: ${url}`);
        const info = await youtubedl(url, options);
        
        let formats = info.formats
            .filter(f => f.url && ['mp4', 'webm', 'mov'].includes(f.ext))
            .map(f => ({
                url: f.url,
                height: f.height || 0,
                width: f.width || 0,
                filesize: f.filesize || 0,
                format: f.ext,
                fps: f.fps || 0,
                requiresAuth: f.height > 480,
                quality_label: f.quality_label || `${f.height}p`,
                vcodec: f.vcodec || 'unknown',
                requiresPremium: f.height > 480 && !req.user.isAdmin,
                isAdminOnly: false
            }));

        // Apply quality restrictions
        if (!canAccessHD) {
            formats = formats.filter(f => f.height <= 480);
        }

        if (formats.length === 0) {
            throw new Error('No downloadable formats found');
        }

        // Add more metadata
        res.json({ 
            formats,
            title: info.title || '',
            thumbnail: info.thumbnail || '',
            duration: info.duration || 0,
            platform,
            contentType,
            uploader: info.uploader || '',
            uploadDate: info.upload_date || ''
        });

    } catch (error) {
        handleDownloadError(error, res, platform);
    }
}

function getFormatString(platform, contentType, hasFullAccess) {
    const qualityLimit = hasFullAccess ? '' : '[height<=480]';
    
    switch (platform) {
        case 'youtube':
            return contentType === 'live' ? 'best' 
                : `bestvideo[ext=mp4]${qualityLimit}+bestaudio[ext=m4a]/best[ext=mp4]${qualityLimit}`;
        case 'instagram':
        case 'facebook':
        case 'threads':
            return `best[ext=mp4]${qualityLimit}/best${qualityLimit}`;
        default:
            return `best${qualityLimit}`;
    }
}

function handleDownloadError(error, res, platform) {
    const errorMap = {
        'Video unavailable': 'Content is private or deleted',
        'Sign in to confirm': 'Age-restricted content',
        'Private video': 'Private content',
        'This video is unavailable': 'Content removed',
    };

    const message = errorMap[error.message] || error.message;
    res.status(400).json({
        error: `Failed to download from ${platform}: ${message}`,
        code: error.code || 'DOWNLOAD_ERROR'
    });
}

// Add auth routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Add signup endpoint
app.post('/api/signup', async (req, res) => {
    const { name, email, password, mobile } = req.body;
    // Add your signup logic here
    // For demo, just return success
    res.json({ success: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
