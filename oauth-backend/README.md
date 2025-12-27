# # AccellaX 361° Silicon by Swimming Ducks | OAuth Backend

> **Secure OAuth 2.0 Token Exchange Service**  
> Serverless authentication backend for Google & Strava integration

[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?logo=vercel)](https://vercel.com)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js)](https://nodejs.org)
[![OAuth 2.0](https://img.shields.io/badge/OAuth-2.0-4285F4)](https://oauth.net/2/)

---

## 🎯 Overview

This serverless backend handles OAuth 2.0 authentication flows for AccellaX 361° mobile and web applications. It securely exchanges authorization codes for access tokens without exposing client secrets to client applications.

**Supported Providers:**
- ✅ **Google OAuth** (Sign in with Google)
- ✅ **Strava OAuth** (Connect fitness data)

**Architecture:**
```
Mobile/Web App
    ↓ redirects to OAuth provider
Google/Strava OAuth
    ↓ returns authorization code
AccellaX OAuth Backend (Vercel)
    ↓ exchanges code for tokens
Returns access_token + user data
    ↓
Mobile/Web App stores token
    ↓
Authenticates with Firebase
```

---

## 🏗️ Architecture

### Folder Structure
```
oauth-backend/
├── api/
│   ├── oauth/
│   │   ├── google.js         # Google OAuth handler
│   │   └── strava.js         # Strava OAuth handler
│   └── callback.js           # Universal callback handler
├── assets/                    # Static assets
├── package.json               # Dependencies
├── vercel.json               # Vercel configuration
└── README.md                 # This file
```

### Deployment
- **Platform**: Vercel Serverless Functions
- **Runtime**: Node.js 18
- **Cost**: Free tier (generous limits)
- **URL**: `https://accellax-oauth.vercel.app`

### Security Features
- 🔒 Client secrets stored in Vercel environment variables
- 🔒 CORS configured for specific origins only
- 🔒 Token exchange happens server-side only
- 🔒 No client secrets exposed to frontend
- 🔒 HTTPS enforced

---

## 🚀 API Endpoints

### Base URL
```
Production:  https://accellax-oauth.vercel.app
Development: http://localhost:3000
```

---

## 📱 Google OAuth

### Endpoint
```
POST /api/oauth/google
```

### Description
Exchanges a Google authorization code for access tokens and user profile data.

### Request Headers
```http
Content-Type: application/json
Origin: https://accellax.co.ke (or allowed origin)
```

### Request Body
```json
{
  "code": "4/0AeanS0aGoogleAuthorizationCode...",
  "redirectUri": "https://accellax.co.ke/auth/callback"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | ✅ | Authorization code from Google |
| `redirectUri` | string | ✅ | Must match the redirect URI used in OAuth flow |

### Success Response (200)
```json
{
  "success": true,
  "access_token": "ya29.a0AfH6SMB...",
  "refresh_token": "1//0gGoogleRefreshToken...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "openid email profile",
  "user": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "given_name": "John",
    "family_name": "Doe",
    "picture": "https://lh3.googleusercontent.com/...",
    "locale": "en",
    "verified_email": true
  }
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "error": "invalid_grant",
  "error_description": "Authorization code has expired or is invalid"
}
```

### Usage Example (React Native)
```javascript
// Step 1: Redirect user to Google OAuth
const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${GOOGLE_CLIENT_ID}` +
  `&redirect_uri=${REDIRECT_URI}` +
  `&response_type=code` +
  `&scope=openid email profile`;

Linking.openURL(googleAuthUrl);

// Step 2: Receive authorization code via deep link
const handleDeepLink = async ({ url }) => {
  const code = new URL(url).searchParams.get('code');
  
  // Step 3: Exchange code for tokens
  const response = await fetch('https://accellax-oauth.vercel.app/api/oauth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri: REDIRECT_URI })
  });
  
  const data = await response.json();
  
  // Step 4: Store tokens and authenticate with Firebase
  await AsyncStorage.setItem('google_token', data.access_token);
  await firebaseAuth.signInWithCustomToken(data.firebase_token);
};
```

---

## 🚴 Strava OAuth

### Endpoint
```
POST /api/oauth/strava
```

### Description
Exchanges a Strava authorization code for access tokens and athlete profile data.

### Request Headers
```http
Content-Type: application/json
Origin: https://accellax.co.ke (or allowed origin)
```

### Request Body
```json
{
  "code": "abcd1234StravaAuthorizationCode",
  "scope": "read,activity:read_all"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | ✅ | Authorization code from Strava |
| `scope` | string | ❌ | OAuth scopes (default: "read,activity:read_all") |

### Success Response (200)
```json
{
  "success": true,
  "access_token": "a1b2c3d4StravaAccessToken...",
  "refresh_token": "e5f6g7h8StravaRefreshToken...",
  "expires_at": 1672531200,
  "expires_in": 21600,
  "token_type": "Bearer",
  "athlete": {
    "id": 12345678,
    "username": "athlete_username",
    "firstname": "John",
    "lastname": "Doe",
    "profile": "https://dgalywyr863hv.cloudfront.net/pictures/athletes/12345678/...",
    "city": "Nairobi",
    "state": "Nairobi County",
    "country": "Kenya",
    "sex": "M",
    "premium": false,
    "created_at": "2020-01-01T00:00:00Z",
    "updated_at": "2024-12-27T00:00:00Z"
  }
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "error": "invalid_grant",
  "error_description": "The authorization code is invalid or has expired"
}
```

### Usage Example (React Native)
```javascript
// Step 1: Redirect user to Strava OAuth
const stravaAuthUrl = `https://www.strava.com/oauth/authorize?` +
  `client_id=${STRAVA_CLIENT_ID}` +
  `&redirect_uri=${REDIRECT_URI}` +
  `&response_type=code` +
  `&scope=read,activity:read_all`;

Linking.openURL(stravaAuthUrl);

// Step 2: Receive authorization code via deep link
const handleDeepLink = async ({ url }) => {
  const code = new URL(url).searchParams.get('code');
  
  // Step 3: Exchange code for tokens
  const response = await fetch('https://accellax-oauth.vercel.app/api/oauth/strava', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  const data = await response.json();
  
  // Step 4: Store tokens
  await AsyncStorage.setItem('strava_token', data.access_token);
  await AsyncStorage.setItem('strava_refresh_token', data.refresh_token);
};
```

---

## 🔄 Universal Callback Handler

### Endpoint
```
GET /api/callback?code={code}&state={state}
```

### Description
Universal callback endpoint that can handle both Google and Strava OAuth redirects. Automatically detects the provider and processes the authorization code.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | ✅ | Authorization code from OAuth provider |
| `state` | string | ❌ | State parameter (provider detection) |
| `scope` | string | ❌ | Granted scopes |
| `error` | string | ❌ | Error code if auth failed |

### Response
Redirects to mobile app deep link with token data:
```
accellax://auth/callback?token={access_token}&provider={google|strava}
```

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Vercel CLI (optional for local testing)
- Google OAuth credentials
- Strava OAuth credentials

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/AccellaX-361.git
cd AccellaX-361/oauth-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Variables
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://accellax-oauth.vercel.app/api/callback

# Strava OAuth
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=your-strava-secret

# Allowed Origins (CORS)
ALLOWED_ORIGINS=https://accellax.co.ke,https://accellax.vercel.app,exp://192.168.1.100:8081

# Firebase (optional - for custom token generation)
FIREBASE_ADMIN_CREDENTIALS=path/to/credentials.json
```

### Local Development
```bash
# Run with Vercel CLI
vercel dev

# Or with Node.js (requires vercel dev environment)
npm run dev
```

Server runs at: `http://localhost:3000`

### Testing Endpoints
```bash
# Test Google OAuth
curl -X POST http://localhost:3000/api/oauth/google \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code","redirectUri":"http://localhost:3000/callback"}'

# Test Strava OAuth
curl -X POST http://localhost:3000/api/oauth/strava \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code"}'
```

---

## 🌐 Deployment

### Vercel Deployment

#### Option 1: GitHub Integration (Recommended)
1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Set Root Directory: `oauth-backend`
4. Add environment variables
5. Deploy automatically on push

#### Option 2: Vercel CLI
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add STRAVA_CLIENT_ID
vercel env add STRAVA_CLIENT_SECRET
```

### Configuration (vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/oauth/(.*)",
      "dest": "/api/oauth/$1"
    },
    {
      "src": "/api/callback",
      "dest": "/api/callback"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🔐 Security Best Practices

### Implemented Security Measures
- ✅ **HTTPS Only**: All requests must use HTTPS in production
- ✅ **CORS Protection**: Only allowed origins can make requests
- ✅ **Environment Variables**: Secrets never exposed in code
- ✅ **Token Exchange Server-Side**: Client secrets stay on server
- ✅ **State Parameter Validation**: Prevents CSRF attacks
- ✅ **Short-lived Tokens**: Access tokens expire (Google: 1 hour, Strava: 6 hours)
- ✅ **Error Sanitization**: Generic errors returned to client

### Additional Recommendations
- 🔒 Implement rate limiting (Vercel Edge Config)
- 🔒 Add request logging (Vercel Analytics)
- 🔒 Monitor failed auth attempts
- 🔒 Rotate OAuth credentials periodically
- 🔒 Use refresh tokens for long-term access

---

## 🐛 Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `invalid_grant` | Authorization code invalid/expired | Request new authorization code |
| `invalid_client` | Client ID/secret incorrect | Check environment variables |
| `redirect_uri_mismatch` | Redirect URI doesn't match | Ensure URI matches OAuth console |
| `invalid_scope` | Requested scope not granted | Check OAuth consent screen |
| `rate_limit_exceeded` | Too many requests | Implement exponential backoff |
| `CORS_ERROR` | Origin not allowed | Add origin to ALLOWED_ORIGINS |

### Error Response Format
```json
{
  "success": false,
  "error": "error_code",
  "error_description": "Human-readable description",
  "timestamp": "2024-12-27T12:00:00Z"
}
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics
- Request count per endpoint
- Response times
- Error rates
- Geographic distribution

### Custom Logging
```javascript
// Add to functions
console.log({
  event: 'oauth_success',
  provider: 'google',
  userId: user.id,
  timestamp: new Date().toISOString()
});
```

---

## 🧪 Testing

### Manual Testing
```bash
# Google OAuth flow
1. Open: https://accounts.google.com/o/oauth2/v2/auth?...
2. Authorize app
3. Copy authorization code
4. Test endpoint with curl/Postman

# Strava OAuth flow
1. Open: https://www.strava.com/oauth/authorize?...
2. Authorize app
3. Copy authorization code
4. Test endpoint with curl/Postman
```

### Automated Testing (Future)
```bash
npm test                    # Run all tests
npm test:unit              # Unit tests
npm test:integration       # Integration tests
```

---

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Google OAuth implementation
- ✅ Strava OAuth implementation
- ✅ Universal callback handler
- ✅ CORS protection
- ✅ Error handling
- ✅ Vercel deployment config

### v1.1.0 (Planned)
- 📋 Firebase custom token generation
- 📋 Rate limiting
- 📋 Request logging
- 📋 Automated tests
- 📋 Health check endpoint

---

## 🤝 Integration with AccellaX Apps

### Mobile App (React Native)
Located in `../app/assessment` and `../app/attendance`

**Configuration:**
```javascript
// app/src/config/oauth.js
export const OAUTH_CONFIG = {
  google: {
    clientId: 'your-client-id.apps.googleusercontent.com',
    redirectUri: 'accellax://auth/callback',
    backendUrl: 'https://accellax-oauth.vercel.app/api/oauth/google'
  },
  strava: {
    clientId: '12345',
    redirectUri: 'accellax://auth/callback',
    backendUrl: 'https://accellax-oauth.vercel.app/api/oauth/strava'
  }
};
```

### Web App (React)
Located in `../web/frontend`

**Configuration:**
```javascript
// web/frontend/src/config/oauth.js
export const OAUTH_CONFIG = {
  google: {
    clientId: 'your-client-id.apps.googleusercontent.com',
    redirectUri: 'https://accellax.co.ke/auth/callback',
    backendUrl: 'https://accellax-oauth.vercel.app/api/oauth/google'
  }
};
```

---

## 📞 Support

- **Developer**: msf_bennett@fedora
- **Company**: Swimming Ducks
- **Brand**: AccellaX 361° | Silicon Ducks
- **Project**: AccellaX 361°
- **Location**: Nairobi, Kenya
- **Issues**: Create GitHub issue in main repository

---

## 📄 License

Proprietary - © 2025 AccellaX 361° Silicon by Swimming Ducks

Part of the AccellaX 361° ecosystem. Not licensed for external use.

---

## 🙏 Acknowledgments

- Google OAuth 2.0 documentation
- Strava API documentation
- Vercel serverless functions
- OAuth 2.0 community

---

**Built with ❤️ by Swimming Ducks for NextGen Multisport Academy | Nairobi, Kenya**

         *AccellaX 361° | Silicon Ducks*
         
         *Secure authentication for the AccellaX 361° platform*
