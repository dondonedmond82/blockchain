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