import express from 'express';
import helmet from 'helmet';
import { requireApiKey } from './auth.js';
import { normalizeEvent } from './event-schema.js';
import { HttpError } from './errors.js';

export function createApp(ledger) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '256kb' }));
  app.use(requireApiKey);

  app.get('/api/v1/health', async (_req, res) => {
    const verification = await ledger.verify();
    res.json({ status: 'ok', ledgerMode: process.env.LEDGER_MODE || 'local', ledger: verification });
  });

  app.post('/api/v1/events', async (req, res, next) => {
    try {
      const event = normalizeEvent(req.body);
      const committed = await ledger.appendEvent(event);
      res.status(committed.duplicate ? 200 : 201).json({
        status: committed.duplicate ? 'duplicate' : 'committed',
        event: committed
      });
    } catch (error) { next(error); }
  });

  app.get('/api/v1/events/:eventId', async (req, res, next) => {
    try {
      const event = await ledger.getEvent(req.params.eventId);
      if (!event) throw new HttpError(404, 'Event not found.');
      res.json(event);
    } catch (error) { next(error); }
  });

  app.get('/api/v1/timber/:grumeId/history', async (req, res, next) => {
    try {
      const grumeId = String(req.params.grumeId).trim();
      if (!grumeId) throw new HttpError(400, 'grumeId is required.');
      res.json({ grumeId, events: await ledger.getHistory(grumeId) });
    } catch (error) { next(error); }
  });

  app.get('/api/v1/ledger/verify', async (_req, res) => {
    const result = await ledger.verify();
    res.status(result.valid ? 200 : 409).json(result);
  });

  app.get('/api/v1/ledger/blocks', async (_req, res) => {
    if (!ledger.getBlocks) {
      return res.status(501).json({ error: 'Block listing is not exposed by this ledger adapter.' });
    }
    res.json({ blocks: ledger.getBlocks() });
  });

  // This endpoint accepts a normalized, approved Arena event.
  // It is NOT an assumed native Arena webhook endpoint. Configure an Arena-side
  // integration only after the installed Arena API/authentication contract is verified.
  app.post('/api/v1/arena/events', async (req, res, next) => {
    try {
      const expected = process.env.ARENA_WEBHOOK_SECRET;
      if (!expected || req.get('x-arena-webhook-secret') !== expected) {
        throw new HttpError(401, 'Invalid or missing Arena webhook secret.');
      }
      const event = normalizeEvent({ ...req.body, source: 'openforis-arena' });
      const committed = await ledger.appendEvent(event);
      res.status(committed.duplicate ? 200 : 201).json({
        source: 'openforis-arena',
        status: committed.duplicate ? 'duplicate' : 'committed',
        event: committed
      });
    } catch (error) { next(error); }
  });

  app.use((_req, _res, next) => next(new HttpError(404, 'Route not found.')));
  app.use((error, _req, res, _next) => {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error(error);
    res.status(status).json({
      error: status === 500 ? 'Internal server error.' : error.message
    });
  });

  return app;
}
