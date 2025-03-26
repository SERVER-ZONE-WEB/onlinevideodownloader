const ytdl = require('ytdl-core');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { url, platform, contentType } = JSON.parse(event.body);
        let videoInfo;

        switch (platform) {
            case 'youtube':
                videoInfo = await getYoutubeInfo(url);
                break;
            case 'instagram':
                videoInfo = await getInstagramInfo(url);
                break;
            case 'facebook':
                videoInfo = await getFacebookInfo(url);
                break;
            case 'threads':
                videoInfo = await getThreadsInfo(url);
                break;
            default:
                throw new Error('Unsupported platform');
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(videoInfo)
        };

    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function getYoutubeInfo(url) {
    const info = await ytdl.getInfo(url);
    return {
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails[0].url,
        duration: parseInt(info.videoDetails.lengthSeconds),
        formats: info.formats.map(format => ({
            url: format.url,
            quality: format.qualityLabel,
            height: format.height,
            format: 'mp4',
            filesize: format.contentLength,
            requiresPremium: format.height > 720
        }))
    };
}

// Placeholder functions for other platforms
async function getInstagramInfo(url) {
    // Implement Instagram download logic
    return mockVideoInfo();
}

async function getFacebookInfo(url) {
    // Implement Facebook download logic
    return mockVideoInfo();
}

async function getThreadsInfo(url) {
    // Implement Threads download logic
    return mockVideoInfo();
}

function mockVideoInfo() {
    return {
        title: 'Sample Video',
        thumbnail: 'https://example.com/thumbnail.jpg',
        duration: 180,
        formats: [
            {
                url: 'https://example.com/video.mp4',
                quality: '720p',
                height: 720,
                format: 'mp4',
                filesize: 1024 * 1024 * 10,
                requiresPremium: false
            }
        ]
    };
}
