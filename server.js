const express = require('express');
const youtubedl = require('youtube-dl-exec');
const app = express();

app.use(express.json());
app.use(express.static('./'));

// Add admin middleware
const adminAuth = (req, res, next) => {
    const adminPassword = req.headers['admin-auth'];
    if (adminPassword !== 'admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.post('/api/download', async (req, res) => {
    try {
        const { url, format, platform, contentType } = req.body;
        
        if (!url || !platform || !contentType) {
            throw new Error('Missing required parameters');
        }

        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
            format: format || 'best'
        };

        // Platform-specific options
        switch (platform) {
            case 'youtube':
                if (contentType === 'short') {
                    options.format = 'best[height<=1080]';
                }
                break;
            case 'instagram':
                if (contentType === 'story' || contentType === 'reel') {
                    options.format = 'best';
                }
                break;
            case 'facebook':
                options.format = 'best[height<=720]';
                break;
            case 'threads':
                options.format = 'best';
                break;
            default:
                throw new Error('Unsupported platform');
        }

        const info = await youtubedl(url, options);

        if (!info || !info.formats) {
            throw new Error('No download options available');
        }

        const formats = info.formats
            .filter(f => f.url) // Only include formats with valid URLs
            .map(f => ({
                url: f.url,
                height: f.height,
                filesize: f.filesize,
                format: f.ext
            }));

        if (formats.length === 0) {
            throw new Error('No valid download formats found');
        }

        res.json({ formats });
    } catch (error) {
        res.status(400).json({ 
            error: error.message || `Failed to process ${platform} ${contentType}` 
        });
    }
});

// Add admin download endpoint
app.post('/api/admin/download', adminAuth, async (req, res) => {
    try {
        const { url, platform, contentType } = req.body;
        
        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
            format: 'best'  // Admin gets best quality
        };

        const info = await youtubedl(url, options);

        if (!info || !info.formats) {
            throw new Error('No download options available');
        }

        const formats = info.formats
            .filter(f => f.url)
            .map(f => ({
                url: f.url,
                height: f.height,
                filesize: f.filesize,
                format: f.ext
            }));

        res.json({ formats });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
