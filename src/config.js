import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  apiKey: process.env.API_KEY || '',
  dataFile: path.resolve(process.env.DATA_FILE || './data/ledger.json'),
  ledgerMode: (process.env.LEDGER_MODE || 'local').toLowerCase(),
  corsOrigin: process.env.CORS_ORIGIN || '',
  fabric: {
    channel: process.env.FABRIC_CHANNEL || 'forest-traceability',
    chaincode: process.env.FABRIC_CHAINCODE || 'forest-traceability',
    mspId: process.env.FABRIC_MSP_ID || '',
    peerEndpoint: process.env.FABRIC_PEER_ENDPOINT || '',
    peerHostAlias: process.env.FABRIC_PEER_HOST_ALIAS || '',
    tlsCertPath: process.env.FABRIC_TLS_CERT_PATH || '',
    certPath: process.env.FABRIC_CERT_PATH || '',
    keyPath: process.env.FABRIC_KEY_PATH || ''
  }
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}
if (!['local', 'fabric'].includes(config.ledgerMode)) {
  throw new Error('LEDGER_MODE must be "local" or "fabric".');
}
