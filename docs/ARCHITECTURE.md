# Architecture and implementation notes

## Logical architecture

1. **OpenForis Arena:** operational records, forms, permissions and data-quality workflow.
2. **Arena adapter:** retrieves approved records through a verified supported Arena API contract; maps records to canonical events.
3. **Node.js API:** validates, normalizes and accepts events; protects endpoints.
4. **Ledger adapter:** local hash-chain for development or Fabric Gateway for a configured permissioned network.
5. **Dashboard/verification client:** future consumer of history and verification endpoints.

## Canonical event fields

- `eventId`: stable unique event identifier.
- `eventType`: event type from the supported list.
- `eventDate`: time the forestry operation occurred.
- `recordedAt`: time the integration service received the event.
- `treeId`: source tree identifier where applicable.
- `grumeId`: existing log identifier where applicable.
- `parentGrumeId`: source log for a processed product.
- `productBatchId`: identifier of a product batch.
- `concessionId`, `aacNumber`, `permitReference`.
- `actorId`, `actorRole`.
- `arenaRecordId`: stable Arena record UUID or identifier.
- `evidenceHash`: SHA-256 digest of canonicalized evidence stored outside the ledger.
- `details`: non-sensitive event-specific metadata.

## Arena integration boundary

The API accepts a normalized event. The Arena-specific adapter is intentionally not hard-coded to an assumed Arena endpoint. Before implementing it, obtain/verify:
- installed Arena server version and supported API documentation;
- authentication method and service-account permissions;
- endpoint for retrieving approved records and record UUID/revision;
- how record approval/cleansing state is represented;
- pagination, rate limits and update notifications;
- relationship representation for parent/child entities.

Use the exported survey's node definitions to map names and UUIDs. Do not assume that a field name alone defines a relational join.

## Data integrity

The local adapter hashes each block and links it to the previous block. It is suitable for development and tests only. Anyone with write access to the local JSON file could rewrite the whole chain. Fabric mode delegates ledger ordering, endorsement and validation to the configured Fabric network.

For production synchronization, use a durable outbox:
1. detect approved Arena record revision;
2. create canonical event and evidence hash;
3. persist pending outbox row;
4. submit to Fabric;
5. store transaction ID and commit status;
6. retry safely on transient failure;
7. reconcile outbox against ledger.

## Transformation genealogy

A processing event should consume one or more input `grumeId` values and create one or more `productBatchId` values. Store parent-child links and quantity/unit reconciliation. The supplied Arena survey includes aggregate transformation data; confirm whether detailed log-level inputs and output batches exist in another entity or must be added to Arena.

## Deployment

Keep Arena, integration API, PostgreSQL outbox, Fabric peers/orderers and reverse proxy isolated by network segment and least-privilege firewall rules. The local JSON ledger is not a production storage choice.
