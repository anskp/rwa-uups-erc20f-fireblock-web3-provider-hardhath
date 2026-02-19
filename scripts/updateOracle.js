const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { ethers } = require("ethers");

/**
 * 📈 RWA Oracle Update Tool
 * Usage: node scripts/updateOracle.js <oracleAddress> <newValue>
 * Example: node scripts/updateOracle.js 0x6d3ae0C680D6251705E1Ba683DC87Ae856A23F2B 350
 */

// --- CONFIGURATION ---
const API_KEY = process.env.FIREBLOCKS_API_KEY;
const VAULT_ID = process.env.FIREBLOCKS_VAULT;
const SECRET_PATH = process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH || path.join(__dirname, "../fireblocks_secret.key");
const SECRET_KEY = fs.readFileSync(SECRET_PATH, "utf8");
const BASE_URL = "https://sandbox-api.fireblocks.io";

const RPCS = [
    "https://sepolia.drpc.org",
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://eth-sepolia.public.blastapi.io"
];

function signRequest(urlPath, body = "") {
    const bodyHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
    const payload = {
        uri: urlPath,
        nonce: crypto.randomBytes(32).toString("hex"),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 55,
        sub: API_KEY,
        bodyHash: bodyHash
    };
    return jwt.sign(payload, SECRET_KEY, { algorithm: "RS256" });
}

async function waitForTransaction(txId) {
    const urlPath = `/v1/transactions/${txId}`;
    let status = "SUBMITTED";
    let result = null;

    process.stdout.write(`⏳ Polling ${txId}...`);

    while (!["COMPLETED", "FAILED", "CANCELLED", "REJECTED"].includes(status)) {
        const token = signRequest(urlPath);
        try {
            const response = await axios.get(BASE_URL + urlPath, {
                headers: { "X-API-Key": API_KEY, "Authorization": `Bearer ${token}` }
            });
            result = response.data;
            status = result.status;
            process.stdout.write(".");
            if (["COMPLETED", "FAILED", "CANCELLED", "REJECTED"].includes(status)) break;
        } catch (error) {
            console.error("\n❌ Polling Error:", error.response?.data || error.message);
            throw error;
        }
        await new Promise(r => setTimeout(r, 3000));
    }

    console.log(`\n✅ Finalized: ${status}`);
    return result;
}

/**
 * ABI Encodes the 'updateValue(int256)' call
 */
function encodeUpdateValue(oracleAddress, newValue, decimals) {
    const iface = new ethers.Interface([
        "function updateValue(int256 newValue)",
        "function decimals() view returns (uint8)"
    ]);

    // Scale value based on decimals (typically 8 for NAV, 18 for PoR)
    const scaledValue = ethers.parseUnits(newValue.toString(), decimals);
    return iface.encodeFunctionData("updateValue", [scaledValue]);
}

async function main() {
    const oracleAddress = process.argv[2];
    const newValue = process.argv[3];

    if (!oracleAddress || !newValue) {
        console.error("❌ Usage: node scripts/updateOracle.js <oracleAddress> <newValue>");
        process.exit(1);
    }

    console.log(`🔥 Fireblocks Oracle Update Tool`);
    console.log(`📍 Oracle: ${oracleAddress}`);
    console.log(`📈 New Value: ${newValue}`);

    // Detect decimals via RPC (Reliability Check)
    let decimals = 8; // Default to NAV
    try {
        const provider = new ethers.JsonRpcProvider(RPCS[0]);
        const contract = new ethers.Contract(oracleAddress, ["function decimals() view returns (uint8)"], provider);
        decimals = await contract.decimals();
        console.log(`🔍 Detected Decimals: ${decimals}`);
    } catch (e) {
        console.warn(`⚠️ Could not detect decimals via RPC. Defaulting to 8.`);
    }

    const data = encodeUpdateValue(oracleAddress, newValue, decimals);

    const body = {
        assetId: "ETH_TEST5",
        source: { type: "VAULT_ACCOUNT", id: VAULT_ID },
        destination: {
            type: "ONE_TIME_ADDRESS",
            oneTimeAddress: { address: oracleAddress }
        },
        amount: "0",
        operation: "CONTRACT_CALL",
        note: `Oracle Update: ${newValue} (${decimals} decimals)`,
        extraParameters: { contractCallData: data }
    };

    try {
        const path = "/v1/transactions";
        const token = signRequest(path, body);
        const res = await axios.post(BASE_URL + path, body, {
            headers: {
                "X-API-Key": API_KEY,
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`✅ Update Submitted! ID: ${res.data.id}`);
        await waitForTransaction(res.data.id);
        console.log(`\n✨ Oracle Successfully Updated to ${newValue}!`);

    } catch (e) {
        console.error("❌ Update Failed:", e.response?.data || e.message);
    }
}

main();
