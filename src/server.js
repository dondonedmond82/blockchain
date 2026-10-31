import { config } from './config.js';
import { createApp } from './app.js';
import { LocalLedger } from './ledger/local-ledger.js';
import { FabricLedger } from './ledger/fabric-ledger.js';

const ledger = config.ledgerMode === 'fabric'
  ? new FabricLedger(config.fabric)
  : new LocalLedger(config.dataFile);

await ledger.init();
const app = createApp(ledger);
const server = app.listen(config.port, config.host, () => {
  console.log(`Forest Traceability API listening on http://${config.host}:${config.port}`);
  console.log(`Ledger mode: ${config.ledgerMode}`);
  console.log('Use x-api-key for protected API endpoints.');
});

function shutdown() {
  server.close(() => {
    ledger.close?.();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
