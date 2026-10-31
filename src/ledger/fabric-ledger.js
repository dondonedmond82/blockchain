import fs from 'node:fs';
import grpc from '@grpc/grpc-js';
import { connect, hash, signers } from '@hyperledger/fabric-gateway';

export class FabricLedger {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.gateway = null;
    this.contract = null;
  }

  async init() {
    const c = this.config;
    const required = ['mspId', 'peerEndpoint', 'peerHostAlias', 'tlsCertPath', 'certPath', 'keyPath'];
    for (const key of required) {
      if (!c[key]) throw new Error(`Missing Fabric configuration: ${key}`);
    }
    const tlsRootCert = fs.readFileSync(c.tlsCertPath);
    const identity = {
      mspId: c.mspId,
      credentials: fs.readFileSync(c.certPath)
    };
    const privateKey = fs.readFileSync(c.keyPath);
    this.client = new grpc.Client(
      c.peerEndpoint,
      grpc.credentials.createSsl(tlsRootCert),
      { 'grpc.ssl_target_name_override': c.peerHostAlias }
    );
    this.gateway = connect({
      client: this.client,
      identity,
      signer: signers.newPrivateKeySigner(privateKey),
      hash: hash.sha256
    });
    this.contract = this.gateway.getNetwork(c.channel).getContract(c.chaincode);
    return this;
  }

  async appendEvent(event) {
    const resultBytes = await this.contract.submitTransaction('CreateEvent', JSON.stringify(event));
    const result = resultBytes.length ? JSON.parse(resultBytes.toString()) : { eventId: event.eventId };
    return { duplicate: false, ...result, event };
  }

  async getEvent(eventId) {
    try {
      const bytes = await this.contract.evaluateTransaction('GetEvent', eventId);
      return JSON.parse(bytes.toString());
    } catch {
      return null;
    }
  }

  async getHistory(grumeId) {
    const bytes = await this.contract.evaluateTransaction('GetHistoryByGrumeId', grumeId);
    return JSON.parse(bytes.toString());
  }

  async verify() {
    return { valid: true, mode: 'fabric', note: 'Ledger consensus and validation are provided by the Fabric network.' };
  }

  close() {
    this.gateway?.close();
    this.client?.close();
  }
}
