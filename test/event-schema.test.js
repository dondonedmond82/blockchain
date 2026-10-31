import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEvent } from '../src/event-schema.js';

test('normalizes a valid log-created event', () => {
  const event = normalizeEvent({
    eventId: 'evt-1',
    eventType: 'log_created',
    treeId: 'TREE-1',
    grumeId: 'GRUME-1',
    quantity: '12.5'
  });
  assert.equal(event.eventType, 'LOG_CREATED');
  assert.equal(event.grumeId, 'GRUME-1');
  assert.equal(event.quantity, 12.5);
});

test('requires grumeId for transport events', () => {
  assert.throws(
    () => normalizeEvent({ eventType: 'LOG_TRANSPORTED', origin: 'A', destination: 'B' }),
    /grumeId is required/
  );
});

test('rejects negative quantities', () => {
  assert.throws(
    () => normalizeEvent({ eventType: 'LOG_CREATED', treeId: 'T1', grumeId: 'G1', quantity: -1 }),
    /non-negative/
  );
});

test('rejects unsupported event types', () => {
  assert.throws(
    () => normalizeEvent({ eventType: 'MAGIC_EVENT' }),
    /eventType must be one of/
  );
});
