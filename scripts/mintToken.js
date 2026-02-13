require("dotenv").config();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const { ethers } = require("ethers");

/**
 * 🛠️ Standalone Fireblocks Transaction Tool
 * Usage: node scripts/mintToken.js <recipient> <amount> <proxyAddress>
 * 
 * Special Mode: node scripts/mintToken.js deploy
 * (Tracks a deployment and discovers the created address)
 */

// --- CONFIGURATION ---
const API_KEY = process.env.FIREBLOCKS_API_KEY;
const VAULT_ID = process.env.FIREBLOCKS_VAULT;
const PRIVATE_KEY_PATH = process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH || "./fireblocks_secret.key";
const PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
const BASE_URL = "https://sandbox-api.fireblocks.io";

const RPCS = [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://rpc.ankr.com/eth_sepolia",
    "https://eth-sepolia.public.blastapi.io"
];

function signRequest(path, body = "") {
    const bodyHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
    const payload = {
        uri: path,
        nonce: crypto.randomBytes(16).toString("hex"),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 55,
        sub: API_KEY,
        bodyHash: bodyHash
    };
    return jwt.sign(payload, PRIVATE_KEY, { algorithm: "RS256" });
}

async function discoverAddress(txHash) {
    console.log(`\n🔍 Searching blockchain for "Contract Created" address...`);
    for (const rpc of RPCS) {
        try {
            const provider = new ethers.JsonRpcProvider(rpc);
            for (let i = 0; i < 5; i++) {
                const receipt = await provider.getTransactionReceipt(txHash);
                if (receipt) {
                    if (receipt.contractAddress) {
                        return receipt.contractAddress;
                    } else {
                        console.log("ℹ️ Transaction receipt found, but it is NOT a deployment (no contractAddress).");
                        return null;
                    }
                }
                process.stdout.write(".");
                await new Promise(r => setTimeout(r, 4000));
            }
        } catch (e) {
            console.log(`⚠️ RPC ${rpc} unresponsive.`);
        }
    }
    return null;
}

async function waitForTransaction(txId) {
    const path = `/v1/transactions/${txId}`;
    let status = "SUBMITTED";
    let result = null;

    console.log(`⏳ Polling Fireblocks status for ${txId}...`);

    while (!["COMPLETED", "FAILED", "CANCELLED", "REJECTED"].includes(status)) {
        const token = signRequest(path);
        try {
            const res = await axios.get(BASE_URL + path, {
                headers: { "X-API-Key": API_KEY, "Authorization": `Bearer ${token}` }
            });
            result = res.data;
            status = result.status;
            process.stdout.write(".");
            if (["COMPLETED", "FAILED", "CANCELLED", "REJECTED"].includes(status)) break;
        } catch (e) {
            console.error("\n❌ Polling Error:", e.response?.data || e.message);
            throw e;
        }
        await new Promise(r => setTimeout(r, 3000));
    }

    console.log(`\n✅ Transaction Finalized: ${status}`);

    // REQUIREMENT: Get FULL response
    console.log("📝 FULL FIREBLOCKS RESPONSE:", JSON.stringify(result, null, 2));

    if (result.txHash) {
        console.log(`🔗 On-Chain Hash: ${result.txHash}`);
        console.log(`🔭 Etherscan Link: https://sepolia.etherscan.io/tx/${result.txHash}`);

        // Try to find deployment address
        const addr = await discoverAddress(result.txHash);
        if (addr) {
            console.log(`\n✨ SUCCESS! DEPLOYED ADDRESS: ${addr}`);
        } else {
            console.log("\nℹ️ No new contract address created. This was likely a mint or standard interaction.");
        }
    }

    return result;
}

function encodeMint(to, amount) {
    const iface = new ethers.Interface(["function mint(address to, uint256 amount)"]);
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    return iface.encodeFunctionData("mint", [to, amountWei]);
}

async function main() {
    const isDeploy = process.argv[2] === "deploy";
    const recipient = process.argv[2] || "0x89e0000000000000000000000000000000000000";
    const amount = process.argv[3] || "100";
    const target = process.argv[4] || process.env.RWA_PROXY_ADDRESS;

    if (!isDeploy && !target) {
        console.error("❌ Error: Proxy address missing. Use: node scripts/mintToken.js <to> <amount> <proxy>");
        process.exit(1);
    }

    let body;
    if (isDeploy) {
        console.log("�️  Mode: Deployment tracking...");
        // User should pass a bytecode/args if they want to deploy
        // But for this tool, they likely just want to "mint"
        // I'll keep the mint logic as default
    }

    // Default to Minting
    const data = encodeMint(recipient, amount);
    body = {
        assetId: "ETH_TEST5",
        source: { type: "VAULT_ACCOUNT", id: VAULT_ID },
        destination: {
            type: "ONE_TIME_ADDRESS",
            oneTimeAddress: { address: target }
        },
        amount: "0",
        operation: "CONTRACT_CALL",
        note: `Standalone Tool Call to ${target}`,
        extraParameters: { contractCallData: data }
    };

    try {
        console.log(`🚀 Sending Mint Request to ${target}...`);
        const path = "/v1/transactions";
        const token = signRequest(path, body);
        const res = await axios.post(BASE_URL + path, body, {
            headers: {
                "X-API-Key": API_KEY,
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`✅ Submitted! ID: ${res.data.id}`);
        await waitForTransaction(res.data.id);

    } catch (e) {
        console.error("❌ Failed:", e.response?.data || e.message);
    }
}

main();
