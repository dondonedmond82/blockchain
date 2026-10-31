'use strict';

const { Contract } = require('fabric-contract-api');

class ForestTraceabilityContract extends Contract {
  async CreateEvent(ctx, eventJson) {
    const event = JSON.parse(eventJson);
    if (!event.eventId || !event.eventType) {
      throw new Error('eventId and eventType are required.');
    }

    const eventKey = ctx.stub.createCompositeKey('FOREST_EVENT', [event.eventId]);
    const existing = await ctx.stub.getState(eventKey);
    if (existing && existing.length > 0) {
      return existing.toString();
    }

    const record = {
      ...event,
      fabricTransactionId: ctx.stub.getTxID(),
      fabricTimestamp: (await ctx.stub.getTxTimestamp()).seconds.toString()
    };

    await ctx.stub.putState(eventKey, Buffer.from(JSON.stringify(record)));

    // Index log and parent-log references for lot-history queries.
    const lotIds = new Set([event.grumeId, event.parentGrumeId].filter(Boolean));
    for (const lotId of lotIds) {
      const indexKey = ctx.stub.createCompositeKey('GRUME_EVENT', [lotId, event.eventId]);
      await ctx.stub.putState(indexKey, Buffer.from(event.eventId));
    }

    return JSON.stringify(record);
  }

  async GetEvent(ctx, eventId) {
    const key = ctx.stub.createCompositeKey('FOREST_EVENT', [eventId]);
    const bytes = await ctx.stub.getState(key);
    if (!bytes || bytes.length === 0) throw new Error(`Event ${eventId} does not exist.`);
    return bytes.toString();
  }

  async GetHistoryByGrumeId(ctx, grumeId) {
    const iterator = await ctx.stub.getStateByPartialCompositeKey('GRUME_EVENT', [grumeId]);
    const events = [];
    try {
      while (true) {
        const result = await iterator.next();
        if (result.value) {
          const eventId = result.value.value.toString();
          const eventBytes = await ctx.stub.getState(
            ctx.stub.createCompositeKey('FOREST_EVENT', [eventId])
          );
          if (eventBytes && eventBytes.length) events.push(JSON.parse(eventBytes.toString()));
        }
        if (result.done) break;
      }
    } finally {
      await iterator.close();
    }
    return JSON.stringify(events);
  }
}

module.exports = ForestTraceabilityContract;
