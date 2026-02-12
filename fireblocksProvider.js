require("dotenv").config();

const fs = require("fs");
const { FireblocksWeb3Provider, ApiBaseUrl } = require("@fireblocks/fireblocks-web3-provider");
const { ethers } = require("ethers");

const privateKeyPath = process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH || "./fireblocks_secret.key";
const privateKey = fs.readFileSync(privateKeyPath, "utf8");

console.log("Initializing Fireblocks Provider...");
console.log("API Key length:", process.env.FIREBLOCKS_API_KEY?.length || 0);
console.log("Vault ID:", process.env.FIREBLOCKS_VAULT);

const eip1193Provider = new FireblocksWeb3Provider({
    apiKey: process.env.FIREBLOCKS_API_KEY,
    privateKey: privateKey,

    // IMPORTANT → ensure array format
    vaultAccountIds: [String(process.env.FIREBLOCKS_VAULT)],

    chainId: 11155111,

    // Correct property name
    apiBaseUrl: ApiBaseUrl.Sandbox,

    logTransactionStatusChanges: true,
    enhancedErrorHandling: true
});


module.exports = new ethers.BrowserProvider(eip1193Provider);
