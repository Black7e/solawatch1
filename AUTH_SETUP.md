# X (Twitter) Authentication Setup

This guide explains how to set up X (Twitter) OAuth authentication for SolaWatch.

## Prerequisites

1. A Twitter Developer Account
2. A Twitter App with OAuth 2.0 enabled

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

Create a `.env` file in your project root with:

```env
# Solana Tracker API Key
VITE_SOLANA_TRACKER_API_KEY=your_solana_tracker_api_key_here

# X (Twitter) OAuth Configuration
VITE_X_CLIENT_ID=your_x_client_id_here
VITE_X_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 5. Production Deployment

For production deployment:

1. Update the callback URL in your Twitter app settings
2. Update `VITE_X_REDIRECT_URI` in your environment variables
3. Ensure your domain is properly configured

## Features

### Authentication Flow

1. **Sign In**: Users click "Sign In" button
2. **OAuth Redirect**: User is redirected to Twitter for authorization
3. **Callback**: Twitter redirects back to `/auth/callback`
4. **Token Exchange**: App exchanges authorization code for access token
5. **User Info**: App fetches user profile information
6. **Session**: User is signed in and session is stored

### User Interface

- **Sign In Button**: Blue X-branded button in header
- **User Profile**: Shows user avatar, name, and username when signed in
- **Sign Out**: Dropdown menu with sign out option
- **Loading States**: Proper loading indicators during authentication

### Security Features

- **PKCE Flow**: Uses Proof Key for Code Exchange for enhanced security
- **Token Storage**: Secure localStorage with expiration handling
- **Token Refresh**: Automatic token refresh when needed
- **Error Handling**: Comprehensive error handling and user feedback

## API Scopes

The app requests the following scopes:
- `tweet.read`: Read user's tweets
- `users.read`: Read user profile information
- `offline.access`: Refresh token access

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Ensure callback URL matches exactly in Twitter app settings
2. **Missing Client ID**: Check that `VITE_X_CLIENT_ID` is set in environment variables
3. **CORS Issues**: Ensure your domain is properly configured in Twitter app settings

### Development vs Production

- **Development**: Use `http://localhost:5173/auth/callback`
- **Production**: Use `https://yourdomain.com/auth/callback`

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your Twitter app credentials
- Monitor your app's usage in the Twitter Developer Portal 