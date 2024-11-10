const crypto = require('crypto');

class SecretsManager {
    static #instance;
    #secrets = new Map();

    constructor() {
        if (SecretsManager.#instance) {
            return SecretsManager.#instance;
        }
        SecretsManager.#instance = this;
    }

    getSecret(key) {
        if (!this.#secrets.has(key)) {
            const secret = crypto.randomBytes(64).toString('hex');
            this.#secrets.set(key, secret);
            // Remove Logger dependency
            console.log(`Generated new secret for: ${key}`);
        }
        return this.#secrets.get(key);
    }

    setSecret(key, value) {
        this.#secrets.set(key, value);
    }

    static getInstance() {
        if (!SecretsManager.#instance) {
            SecretsManager.#instance = new SecretsManager();
        }
        return SecretsManager.#instance;
    }
}

module.exports = SecretsManager;