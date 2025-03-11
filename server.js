const express = require('express');
const youtubedl = require('youtube-dl-exec');
const app = express();

app.use(express.json());
app.use(express.static('./'));

app.post('/api/download', async (req, res) => {
    try {
        const { url, format } = req.body;
        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            format: format
        };

        // Add extra options for stories
        if (url.includes('stories') || url.includes('shorts')) {
            options.extractAudio = false;
            options.format = 'best';
        }

        const info = await youtubedl(url, options);

        const formats = info.formats.map(format => ({
            url: format.url,
            height: format.height,
            filesize: format.filesize,
            format: format.ext
        }));

        res.json({ formats });
    } catch (error) {
        res.json({ error: 'Failed to process URL. Make sure it\'s a valid video or story link.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
