import express from 'express';
import axios from 'axios';
import cors from 'cors';
import NodeCache from 'node-cache';

const app = express();
const PORT = process.env.PORT || 4000;
const cache = new NodeCache();

app.use(cors());

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

app.listen(PORT, () => {
  console.log(`Backend proxy/cache listening on port ${PORT}`);
}); 