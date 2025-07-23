import express from 'express';
import axios from 'axios';
import cors from 'cors';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const cache = new NodeCache();

// X OAuth Configuration
const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper: cache wrapper
async function cachedFetch<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) return cached;
  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
}

// Batch token metadata endpoint
app.get('/api/token-metadata', async (req, res) => {
  const mints = (req.query.mints as string)?.split(',').filter(Boolean) || [];
  if (mints.length === 0) return res.status(400).json({ error: 'No mints provided' });
  try {
    const key = `metadata:${mints.sort().join(',')}`;
    const ttl = 60 * 60 * 24 * 7; // 7 days
    const data = await cachedFetch(key, ttl, async () => {
      // Example: Jupiter token list (replace with your preferred source)
      const resp = await axios.get('https://token.jup.ag/all');
      const allTokens = resp.data as any[];
      const result = mints.map(mint => allTokens.find(t => t.address === mint || t.mint === mint) || null);
      return result;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch token metadata', details: err instanceof Error ? err.message : err });
  }
});

// Batch token prices endpoint
app.get('/api/token-prices', async (req, res) => {
  const mints = (req.query.mints as string)?.split(',').filter(Boolean) || [];
  if (mints.length === 0) return res.status(400).json({ error: 'No mints provided' });
  try {
    const key = `prices:${mints.sort().join(',')}`;
    const ttl = 60 * 5; // 5 minutes
    const data = await cachedFetch(key, ttl, async () => {
      // Example: Jupiter price API
      const resp = await axios.get(`https://price.jup.ag/v4/price?ids=${mints.join(',')}`);
      return resp.data?.data || {};
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch token prices', details: err instanceof Error ? err.message : err });
  }
});

// X OAuth token exchange proxy
app.post('/api/auth/x/token', async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri } = req.body;

    if (!code || !code_verifier || !redirect_uri) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
      return res.status(500).json({ error: 'OAuth configuration missing' });
    }

    const response = await axios.post('https://api.twitter.com/2/oauth2/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        code_verifier,
      }), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({
        error: 'Token exchange failed',
        details: error.response?.data || error.message
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// X OAuth refresh token proxy
app.post('/api/auth/x/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
      return res.status(500).json({ error: 'OAuth configuration missing' });
    }

    const response = await axios.post('https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('OAuth refresh error:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({
        error: 'Token refresh failed',
        details: error.response?.data || error.message
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// X OAuth user information proxy
app.get('/api/auth/x/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const accessToken = authHeader.replace('Bearer ', '');

    const response = await axios.get('https://api.twitter.com/2/users/me?user.fields=id,username,name,profile_image_url,verified,public_metrics', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('OAuth user fetch error:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({
        error: 'Failed to fetch user information',
        details: error.response?.data || error.message
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy/cache listening on port ${PORT}`);
}); 