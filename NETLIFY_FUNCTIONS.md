# Netlify Serverless Functions Guide

This guide explains how to use Netlify serverless functions for OAuth authentication and other server-side operations in SolaWatch.

## What are Netlify Functions?

Netlify serverless functions are **serverless API endpoints** that run on Netlify's infrastructure. They're perfect for:

- **OAuth flows** (X/Twitter authentication)
- **API proxies** (to avoid CORS issues)
- **Database operations**
- **File processing**
- **Webhook handlers**

## Key Benefits

1. **No separate server needed** - Functions run on Netlify's infrastructure
2. **Automatic scaling** - Only pay for what you use
3. **Built-in CORS support** - No CORS configuration needed
4. **Environment variables** - Secure storage of API keys
5. **Deploy with your frontend** - Everything in one repository

## Project Structure

```
project/
├── netlify/
│   └── functions/
│       ├── auth-x-token.js      # X OAuth token exchange
│       ├── auth-x-refresh.js    # X OAuth token refresh
│       └── package.json         # Function dependencies
├── src/
│   └── services/
│       └── authService.ts       # Updated to use functions
└── netlify.toml                 # Netlify configuration
```

## Function Endpoints

### 1. X OAuth Token Exchange
- **URL**: `/.netlify/functions/auth-x-token`
- **Method**: POST
- **Purpose**: Exchange authorization code for access token

### 2. X OAuth Token Refresh
- **URL**: `/.netlify/functions/auth-x-refresh`
- **Method**: POST
- **Purpose**: Refresh expired access tokens

## Environment Variables

### Netlify Dashboard
Set these in your Netlify dashboard under **Site settings > Environment variables**:

```env
X_CLIENT_ID=your_x_client_id_here
X_CLIENT_SECRET=your_x_client_secret_here
```

### Local Development
For local testing, create a `.env` file in the `netlify/functions/` directory:

```env
X_CLIENT_ID=your_x_client_id_here
X_CLIENT_SECRET=your_x_client_secret_here
```

## Local Development

### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. Start Local Development
```bash
# Start frontend
npm run dev

# In another terminal, start Netlify functions locally
netlify dev
```

### 3. Test Functions Locally
Functions will be available at:
- `http://localhost:8888/.netlify/functions/auth-x-token`
- `http://localhost:8888/.netlify/functions/auth-x-refresh`

## Deployment

### 1. Automatic Deployment
When you push to your main branch, Netlify will automatically:
- Build your frontend
- Deploy your functions
- Set up the function endpoints

### 2. Manual Deployment
```bash
# Build and deploy
netlify deploy --prod
```

## Function Code Structure

Each function follows this pattern:

```javascript
const axios = require('axios');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Your function logic here
    const data = JSON.parse(event.body);
    
    // Make API calls, process data, etc.
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## Frontend Integration

The frontend automatically detects the environment:

```typescript
// Development: Use local backend
// Production: Use Netlify functions
const isDevelopment = import.meta.env.DEV;
const API_BASE = isDevelopment 
  ? 'http://localhost:4000'
  : '/.netlify/functions';

const endpoint = isDevelopment 
  ? `${API_BASE}/api/auth/x/token`
  : `${API_BASE}/auth-x-token`;
```

## Security Features

### 1. Environment Variables
- API keys stored securely in Netlify dashboard
- Never exposed in client-side code
- Automatically encrypted

### 2. CORS Protection
- Built-in CORS headers
- Preflight request handling
- Origin validation (can be customized)

### 3. Rate Limiting
- Netlify provides automatic rate limiting
- Configurable per function
- Protects against abuse

## Monitoring & Logs

### 1. Function Logs
View logs in Netlify dashboard:
- **Site settings > Functions > Function logs**
- Real-time function execution logs
- Error tracking and debugging

### 2. Analytics
- Function execution metrics
- Response times
- Error rates
- Usage statistics

## Cost Considerations

### Free Tier
- **125,000 function invocations per month**
- **100 hours of function execution**
- Perfect for most OAuth implementations

### Paid Plans
- **Pro**: $19/month - 500,000 invocations
- **Business**: $99/month - 2,000,000 invocations

## Best Practices

### 1. Error Handling
```javascript
try {
  // Your logic
} catch (error) {
  console.error('Function error:', error);
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    })
  };
}
```

### 2. Input Validation
```javascript
const { code, code_verifier } = JSON.parse(event.body);

if (!code || !code_verifier) {
  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({ error: 'Missing required parameters' })
  };
}
```

### 3. Response Headers
Always include CORS headers:
```javascript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
```

## Troubleshooting

### Common Issues

1. **Function not found**
   - Check function file is in `netlify/functions/`
   - Verify function name matches URL
   - Ensure proper exports

2. **Environment variables not working**
   - Check Netlify dashboard settings
   - Verify variable names match code
   - Redeploy after adding variables

3. **CORS errors**
   - Functions include CORS headers by default
   - Check if frontend is calling correct URL
   - Verify preflight request handling

4. **Function timeout**
   - Default timeout is 10 seconds
   - Optimize API calls and processing
   - Consider breaking into smaller functions

### Debugging

1. **Local testing**
   ```bash
   netlify dev --debug
   ```

2. **Function logs**
   - Check Netlify dashboard
   - Use `console.log()` for debugging
   - Monitor function execution times

3. **Network tab**
   - Check browser network tab
   - Verify function calls
   - Monitor response times

## Migration from Backend

If you're migrating from a separate backend:

1. **Move API endpoints** to `netlify/functions/`
2. **Update frontend URLs** to use `/.netlify/functions/`
3. **Set environment variables** in Netlify dashboard
4. **Test locally** with `netlify dev`
5. **Deploy and verify** functionality

## Additional Functions

You can add more functions for other features:

- **Token metadata caching**
- **Price data aggregation**
- **Webhook handlers**
- **Database operations**
- **File processing**

Each function should be in its own file in `netlify/functions/`. 