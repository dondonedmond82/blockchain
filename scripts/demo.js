const baseUrl = process.env.API_URL || 'http://127.0.0.1:3000';
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error('Set API_KEY in .env before running npm run demo.');
  process.exit(1);
}

const sampleEvents = [
  {
    eventId: 'demo-tree-0001',
    eventType: 'TREE_REGISTERED',
    treeId: 'TREE-DEMO-0001',
    concessionId: 'PEA-DEMO-001',
    aacNumber: 'AAC-DEMO-2026',
    actorId: 'agent-demo',
    actorRole: 'FOREST_OPERATOR',
    arenaRecordId: 'ARENA-DEMO-TREE-001',
    details: { species: 'Sapelli', note: 'Synthetic demonstration record' }
  },
  {
    eventId: 'demo-harvest-0001',
    eventType: 'TREE_HARVESTED',
    treeId: 'TREE-DEMO-0001',
    concessionId: 'PEA-DEMO-001',
    aacNumber: 'AAC-DEMO-2026',
    actorId: 'agent-demo',
    actorRole: 'FOREST_OPERATOR',
    arenaRecordId: 'ARENA-DEMO-HARVEST-001',
    eventDate: '2026-10-31T08:30:00Z',
    details: { harvestPermitReference: 'PERMIT-DEMO-001' }
  },
  {
    eventId: 'demo-log-0001',
    eventType: 'LOG_CREATED',
    treeId: 'TREE-DEMO-0001',
    grumeId: 'GRUME-DEMO-0001',
    concessionId: 'PEA-DEMO-001',
    aacNumber: 'AAC-DEMO-2026',
    actorId: 'agent-demo',
    actorRole: 'FOREST_OPERATOR',
    quantity: 8.45,
    unit: 'm3',
    arenaRecordId: 'ARENA-DEMO-LOG-001',
    details: { species: 'Sapelli' }
  },
  {
    eventId: 'demo-transport-0001',
    eventType: 'LOG_TRANSPORTED',
    grumeId: 'GRUME-DEMO-0001',
    origin: 'Parc à grumes - AAC-DEMO-2026',
    destination: 'Usine de transformation - Demo',
    actorId: 'transporter-demo',
    actorRole: 'TRANSPORTER',
    arenaRecordId: 'ARENA-DEMO-TRANSPORT-001',
    details: { vehicleReference: 'VEHICLE-DEMO-01' }
  }
];

for (const event of sampleEvents) {
  const response = await fetch(`${baseUrl}/api/v1/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(event)
  });
  const body = await response.json();
  console.log(response.status, body.status || body.error, event.eventType);
}

const history = await fetch(`${baseUrl}/api/v1/timber/GRUME-DEMO-0001/history`, {
  headers: { 'x-api-key': apiKey }
});
console.log('\nTimber history:\n', JSON.stringify(await history.json(), null, 2));
