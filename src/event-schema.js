import { randomUUID } from 'node:crypto';
import { HttpError } from './errors.js';

export const EVENT_TYPES = Object.freeze([
  'TREE_REGISTERED',
  'TREE_HARVESTED',
  'LOG_CREATED',
  'LOG_TRANSPORTED',
  'LOG_RECEIVED',
  'PROCESSING_RECORDED',
  'PRODUCT_BATCH_CREATED',
  'PRODUCT_TRANSPORTED',
  'TIMBER_SOLD',
  'TIMBER_EXPORTED',
  'LEGALITY_CERTIFIED',
  'RECORD_CORRECTED'
]);

const requiredByType = {
  TREE_REGISTERED: ['treeId'],
  TREE_HARVESTED: ['treeId'],
  LOG_CREATED: ['treeId', 'grumeId'],
  LOG_TRANSPORTED: ['grumeId', 'origin', 'destination'],
  LOG_RECEIVED: ['grumeId', 'destination'],
  PROCESSING_RECORDED: ['grumeId'],
  PRODUCT_BATCH_CREATED: ['productBatchId', 'parentGrumeId'],
  PRODUCT_TRANSPORTED: ['productBatchId', 'origin', 'destination'],
  TIMBER_SOLD: ['grumeId'],
  TIMBER_EXPORTED: ['grumeId'],
  LEGALITY_CERTIFIED: ['concessionId', 'permitReference'],
  RECORD_CORRECTED: ['correctsEventId', 'correctionReason']
};

const optionalStringFields = [
  'treeId', 'grumeId', 'parentGrumeId', 'productBatchId',
  'concessionId', 'aacNumber', 'permitReference', 'origin',
  'destination', 'actorId', 'actorRole', 'arenaRecordId',
  'arenaSurveyUuid', 'evidenceHash', 'unit', 'correctsEventId',
  'correctionReason'
];

function cleanString(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value).trim();
}

export function normalizeEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Request body must be a JSON object.');
  }

  const eventType = cleanString(input.eventType)?.toUpperCase();
  if (!EVENT_TYPES.includes(eventType)) {
    throw new HttpError(400, `eventType must be one of: ${EVENT_TYPES.join(', ')}`);
  }

  const event = {
    schemaVersion: '1.0',
    eventId: cleanString(input.eventId) || randomUUID(),
    eventType,
    eventDate: input.eventDate ? new Date(input.eventDate).toISOString() : new Date().toISOString(),
    recordedAt: new Date().toISOString()
  };

  for (const field of optionalStringFields) {
    const value = cleanString(input[field]);
    if (value !== undefined) event[field] = value;
  }

  if (input.quantity !== undefined && input.quantity !== null && input.quantity !== '') {
    const quantity = Number(input.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new HttpError(400, 'quantity must be a non-negative number.');
    }
    event.quantity = quantity;
  }

  if (input.details !== undefined) {
    if (!input.details || typeof input.details !== 'object' || Array.isArray(input.details)) {
      throw new HttpError(400, 'details must be a JSON object.');
    }
    event.details = input.details;
  } else {
    event.details = {};
  }

  for (const field of (requiredByType[eventType] || [])) {
    if (!event[field]) throw new HttpError(400, `${field} is required for ${eventType}.`);
  }

  if (event.arenaRecordId && event.arenaRecordId.length > 200) {
    throw new HttpError(400, 'arenaRecordId is too long.');
  }

  return event;
}
