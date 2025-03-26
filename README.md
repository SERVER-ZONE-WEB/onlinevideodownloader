# VidDown Pro - Online Video Downloader

A secure and feature-rich video downloader supporting multiple platforms and formats.

## Features

- Multi-platform support (YouTube, Instagram, Facebook, Threads)
- Multiple content types (Videos, Shorts, Stories, Reels, etc.)
- Secure authentication system
- Premium subscription support
- UPI payment integration
- Rate limiting and security features
- Responsive design

## Supported Platforms & Content Types

- **YouTube**: Videos, Shorts, Live Streams
- **Instagram**: Posts, Stories, Reels, IGTV
- **Facebook**: Videos, Stories, Reels
- **Threads**: Posts & Videos

## Quality Options

- **Free Users**: Up to 480p
- **Premium Users**: Up to 1080p/4K
- **Admin Access**: Unrestricted

## Security Features

- JWT Authentication
- Rate Limiting
- XSS Protection
- Security Headers
- Parameter Pollution Prevention
- CORS Protection

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd onlinevideodownloader
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with required credentials:
```env
JWT_SECRET=your-secret
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
FACEBOOK_APP_ID=your-id
FACEBOOK_APP_SECRET=your-secret
```

4. Start the server:
```bash
npm start
```

## API Endpoints

- `POST /api/download`: Download content
- `POST /api/validate`: Validate URLs
- `POST /api/login`: User login
- `POST /api/signup`: User registration
- `GET /api/auth/google`: Google authentication
- `GET /api/auth/facebook`: Facebook authentication

## Premium Features

- HD Quality Downloads (720p+)
- No wait time
- No advertisements
- Priority support

## Development

1. Install dev dependencies:
```bash
npm install --save-dev nodemon
```

2. Run in development mode:
```bash
npm run dev
```

## Security Best Practices

- Use HTTPS in production
- Regular dependency updates
- Input validation
- Rate limiting
- Security headers
- XSS protection

## Environment Variables

- `JWT_SECRET`: Secret key for JWT
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth secret
- `FACEBOOK_APP_ID`: Facebook App ID
- `FACEBOOK_APP_SECRET`: Facebook App secret
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## License

MIT License - See LICENSE file for details

## Support

For support, email: support@viddownpro.com