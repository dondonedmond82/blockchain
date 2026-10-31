import { timingSafeEqual } from 'node:crypto';
import { config } from './config.js';

export function requireApiKey(req, res, next) {
  // Health check is intentionally public; all other routes require an API key.
  if (req.path === '/api/v1/health') return next();
  if (!config.apiKey) {
    return res.status(503).json({ error: 'API_KEY is not configured. Set it in .env before using protected endpoints.' });
  }
  const supplied = req.get('x-api-key') || '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(config.apiKey);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized: provide a valid x-api-key header.' });
  }
  next();
}
