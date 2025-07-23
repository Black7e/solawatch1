# X (Twitter) Authentication Setup

This guide explains how to set up X (Twitter) OAuth authentication for SolaWatch.

## Prerequisites

1. A Twitter Developer Account
2. A Twitter App with OAuth 2.0 enabled
3. Backend server running on port 4000

## Setup Steps

### 1. Create a Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Enable OAuth 2.0 in your app settings

### 2. Configure OAuth 2.0 Settings

In your Twitter app settings:

1. **App permissions**: Set to "Read" (minimum required)
2. **Type of App**: Web App
3. **Callback URLs**: Add your callback URL
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
4. **Website URL**: Your app's main URL

### 3. Get Your Credentials

From your Twitter app dashboard, copy:
- **Client ID** (OAuth 2.0 Client ID)
- **Client Secret** (OAuth 2.0 Client Secret)

### 4. Environment Variables

#### Frontend (.env file in project root)

```env
# Solana Tracker API Key
VITE_SOLANA_TRACKER_API_KEY=your_solana_tracker_api_key_here

# X (Twitter) OAuth Configuration
VITE_X_CLIENT_ID=your_x_client_id_here
VITE_X_REDIRECT_URI=http://localhost:5173/auth/callback

# Backend URL
VITE_BACKEND_URL=http://localhost:4000
```

#### Backend (.env file in backend directory)

```env
# X (Twitter) OAuth Configuration
X_CLIENT_ID=your_x_client_id_here
X_CLIENT_SECRET=your_x_client_secret_here
```

### 5. Start the Backend Server

```bash
cd backend
npm start
```

The backend server should be running on port 4000.

### 6. Production Deployment

For production deployment:

1. Update the callback URL in your Twitter app settings
2. Update environment variables for both frontend and backend
3. Ensure your domain is properly configured
4. Deploy the backend server to your hosting provider

## Features

### Authentication Flow

1. **Sign In**: Users click "Sign In" button
2. **OAuth Redirect**: User is redirected to Twitter for authorization
3. **Callback**: Twitter redirects back to `/auth/callback`
4. **Token Exchange**: Backend exchanges authorization code for access token
5. **User Info**: App fetches user profile information
6. **Session**: User is signed in and session is stored

### User Interface

- **Sign In Button**: Blue X-branded button in header
- **User Profile**: Shows user avatar, name, and username when signed in
- **Sign Out**: Dropdown menu with sign out option
- **Loading States**: Proper loading indicators during authentication

### Security Features

- **PKCE Flow**: Uses Proof Key for Code Exchange for enhanced security
- **Backend Proxy**: Token exchange handled by backend to avoid CORS issues
- **Token Storage**: Secure localStorage with expiration handling
- **Token Refresh**: Automatic token refresh when needed
- **Error Handling**: Comprehensive error handling and user feedback

## Security Implementation

### Backend Proxy Approach

This implementation uses a **backend proxy** to handle OAuth token exchange:

- **Frontend**: Handles OAuth authorization flow and user interface
- **Backend**: Handles token exchange with Twitter's API (solves CORS issues)
- **Client ID & Secret**: Stored securely on the backend
- **PKCE**: Still used for enhanced security

This approach is:
- ✅ **CORS Compliant**: No cross-origin issues with Twitter's API
- ✅ **Secure**: Client Secret stays on the backend
- ✅ **OAuth 2.0 Compliant**: Follows OAuth 2.0 best practices
- ✅ **Production Ready**: Works in both development and production

## API Scopes

The app requests the following scopes:
- `tweet.read`: Read user's tweets
- `users.read`: Read user profile information

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Ensure callback URL matches exactly in Twitter app settings
2. **Missing Environment Variables**: Check that all required environment variables are set
3. **Backend Not Running**: Ensure the backend server is running on port 4000
4. **CORS Issues**: The backend proxy should resolve CORS issues

### Development vs Production

- **Development**: 
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:4000`
  - Callback: `http://localhost:5173/auth/callback`
- **Production**: 
  - Frontend: `https://yourdomain.com`
  - Backend: `https://yourdomain.com/api` (or separate backend domain)
  - Callback: `https://yourdomain.com/auth/callback`

## Security Notes

- Never commit your `.env` files to version control
- Use environment variables for all sensitive configuration
- Keep Client Secret secure on the backend only
- Regularly rotate your Twitter app credentials
- Monitor your app's usage in the Twitter Developer Portal 