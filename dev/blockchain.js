function Blockchain() {
    this.chain = [];
    this.newTransaction = [];
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.newTransaction,
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash
        };
        this.chain.push(newBlock);
        this.newTransaction = [];

        return newBlock;
    };


// Export Blockchain module
module.exports = Blockchain;

// Test blockchain implementation
if (require.main === module) {
    const myBlockchain = new Blockchain();

    const genesisBlock = myBlockchain.createNewBlock(
        100,
        '0',
        'genesis-hash'
    );

    console.log('Blockchain initialized successfully!');
    console.log(JSON.stringify(myBlockchain.chain, null, 4));
}