import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { LocalLedger } from '../src/ledger/local-ledger.js';

test('creates genesis block, appends event and verifies hash links', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'forest-ledger-'));
  try {
    const ledger = await new LocalLedger(path.join(dir, 'ledger.json')).init();
    assert.equal(ledger.verify().valid, true);
    const result = await ledger.appendEvent({
      eventId: 'event-1',
      eventType: 'LOG_CREATED',
      grumeId: 'GRUME-1'
    });
    assert.equal(result.blockIndex, 1);
    assert.equal(ledger.getHistory('GRUME-1').length, 1);
    assert.equal(ledger.verify().valid, true);
    const duplicate = await ledger.appendEvent({
      eventId: 'event-1',
      eventType: 'LOG_CREATED',
      grumeId: 'GRUME-1'
    });
    assert.equal(duplicate.duplicate, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
