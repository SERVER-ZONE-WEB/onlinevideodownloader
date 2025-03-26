const jwt = require('jsonwebtoken');

// Get secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        // Add your actual authentication logic here
        // This is just a mock implementation
        if (email && password) {
            // Generate JWT token
            const token = jwt.sign(
                { email, role: 'user' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            };
        }

        throw new Error('Invalid credentials');

    } catch (error) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Authentication failed' })
        };
    }
};
