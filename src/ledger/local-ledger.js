import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from '../errors.js';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const stableJson = (value) => JSON.stringify(value);

export class LocalLedger {
  constructor(filePath) {
    this.filePath = filePath;
    this.state = { blocks: [], events: [] };
    this.writeQueue = Promise.resolve();
  }

  async init() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      this.state = JSON.parse(await readFile(this.filePath, 'utf8'));
      if (!Array.isArray(this.state.blocks) || !Array.isArray(this.state.events)) {
        throw new Error('Invalid local ledger structure.');
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const genesis = {
        index: 0,
        timestamp: new Date().toISOString(),
        previousHash: '0',
        events: [],
        hash: ''
      };
      genesis.hash = this.hashBlock(genesis);
      this.state = { blocks: [genesis], events: [] };
      await this.persist();
    }
    return this;
  }

  hashBlock(block) {
    return sha256(stableJson({
      index: block.index,
      timestamp: block.timestamp,
      previousHash: block.previousHash,
      events: block.events
    }));
  }

  async persist() {
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(this.state, null, 2), 'utf8');
    await rename(tmp, this.filePath);
  }

  async appendEvent(event) {
    // Serialize writes so concurrent API calls cannot create competing block indexes.
    const operation = this.writeQueue.then(async () => {
      const duplicate = this.state.events.find((e) => e.eventId === event.eventId);
      if (duplicate) return { duplicate: true, ...duplicate };

      if (event.arenaRecordId) {
        const sameArenaRecord = this.state.events.find(
          (e) => e.arenaRecordId === event.arenaRecordId &&
                 e.eventType === event.eventType
        );
        if (sameArenaRecord) return { duplicate: true, ...sameArenaRecord };
      }

      const previous = this.state.blocks.at(-1);
      const block = {
        index: this.state.blocks.length,
        timestamp: new Date().toISOString(),
        previousHash: previous.hash,
        events: [event],
        hash: ''
      };
      block.hash = this.hashBlock(block);
      const committed = { ...event, blockIndex: block.index, blockHash: block.hash };
      this.state.blocks.push(block);
      this.state.events.push(committed);
      await this.persist();
      return { duplicate: false, ...committed };
    });
    this.writeQueue = operation.catch(() => {});
    return operation;
  }

  getEvent(eventId) {
    return this.state.events.find((e) => e.eventId === eventId) || null;
  }

  getHistory(grumeId) {
    return this.state.events.filter(
      (e) => e.grumeId === grumeId || e.parentGrumeId === grumeId
    );
  }

  getBlocks() {
    return this.state.blocks;
  }

  verify() {
    const blocks = this.state.blocks;
    if (!blocks.length) return { valid: false, reason: 'No genesis block.' };
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (block.index !== i) return { valid: false, reason: `Invalid block index at ${i}.` };
      if (i === 0 && block.previousHash !== '0') {
        return { valid: false, reason: 'Invalid genesis previousHash.' };
      }
      if (i > 0 && block.previousHash !== blocks[i - 1].hash) {
        return { valid: false, reason: `Broken previousHash link at block ${i}.` };
      }
      if (block.hash !== this.hashBlock(block)) {
        return { valid: false, reason: `Hash mismatch at block ${i}.` };
      }
    }
    return { valid: true, blocks: blocks.length, events: this.state.events.length };
  }
}
