exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { url } = JSON.parse(event.body);
        
        // URL validation logic
        const urlPattern = {
            youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
            instagram: /^(https?:\/\/)?(www\.)?(instagram\.com)\/.+$/,
            facebook: /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+$/,
            threads: /^(https?:\/\/)?(www\.)?(threads\.net)\/.+$/
        };

        let platform = null;
        let valid = false;

        for (const [key, pattern] of Object.entries(urlPattern)) {
            if (pattern.test(url)) {
                platform = key;
                valid = true;
                break;
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ valid, platform })
        };

    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid request' })
        };
    }
};
