# AccellaX OAuth Backend

Secure OAuth token exchange service for AccellaX 361° mobile app.

## Endpoints

### POST /api/oauth/google
Exchange Google authorization code for access token.

**Request:**
```json
{
  "code": "authorization_code",
  "redirectUri": "your_redirect_uri"
}
```

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "picture": "..."
  }
}
```

### POST /api/oauth/strava
Exchange Strava authorization code for access token.

**Request:**
```json
{
  "code": "authorization_code"
}
```

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": 1234567890,
  "athlete": { ... }
}