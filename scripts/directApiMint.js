const axios = require("axios");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { ethers } = require("ethers");

/**
 * 🚀 RWA Deployment Tool - Fireblocks Direct API
 * Features: Multi-RPC address discovery, auto-polling, and orchestration.
 */

// --- CONFIGURATION ---
const API_KEY = process.env.FIREBLOCKS_API_KEY;
const VAULT_ID = process.env.FIREBLOCKS_VAULT;
const SECRET_PATH = process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH || path.join(__dirname, "../fireblocks_secret.key");
const SECRET_KEY = fs.readFileSync(SECRET_PATH, "utf8");
const BASE_URL = "https://sandbox-api.fireblocks.io";

// Reliable RPCs for Sepolia Address Discovery
const RPCS = [
    "https://sepolia.drpc.org",
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://eth-sepolia.public.blastapi.io",
    "https://rpc.ankr.com/eth_sepolia"
];

/**
 * Signs the request using RS256 JWT
 */
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

/**
 * Sends a POST request to Fireblocks
 */
async function sendPostRequest(urlPath, body, note) {
    const token = signRequest(urlPath, body);
    try {
        const response = await axios.post(BASE_URL + urlPath, body, {
            headers: {
                "X-API-Key": API_KEY,
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error(`❌ POST Error (${urlPath}):`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Attempts to fetch a transaction receipt with retries and multiple RPCs
 */
async function getContractAddressFromReceipt(txHash) {
    console.log(`🔍 Searching for contract address on-chain...`);

    for (const rpc of RPCS) {
        try {
            const provider = new ethers.JsonRpcProvider(rpc);
            // Polling loop for receipt (Wait up to 40 seconds per RPC if needed)
            for (let i = 0; i < 10; i++) {
                const receipt = await provider.getTransactionReceipt(txHash);
                if (receipt) {
                    if (receipt.contractAddress) {
                        return receipt.contractAddress;
                    } else if (receipt.status === 0) {
                        throw new Error("Transaction reverted on-chain.");
                    } else {
                        // Found receipt, but no contractAddress. 
                        // Keep looking in case of indexing lag.
                        process.stdout.write("?");
                    }
                }
                process.stdout.write(".");
                await new Promise(r => setTimeout(r, 4000));
            }
        } catch (e) {
            console.log(`\n⚠️ RPC ${rpc} check failed: ${e.message}`);
        }
    }
    return null;
}

/**
 * Polls Fireblocks for transaction completion
 */
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

    if (status !== "COMPLETED") {
        throw new Error(`Transaction ${txId} ended with status: ${status}`);
    }

    // Capture Address
    let deployedAddress = result.contractAddress || result.extraParameters?.contractAddress;

    // Fallback to Receipt discovery
    if (!deployedAddress && result.txHash) {
        deployedAddress = await getContractAddressFromReceipt(result.txHash);
    }

    if (deployedAddress) {
        console.log(`✨ Captured Address: ${deployedAddress}`);
        result.deployedAddress = deployedAddress;
    } else {
        result.deployedAddress = result.destinationAddress;
    }

    return result;
}

/**
 * Sends a CONTRACT_CALL to Fireblocks
 */
async function sendContractCall(contractAddress, data, note) {
    const body = {
        assetId: "ETH_TEST5",
        source: { type: "VAULT_ACCOUNT", id: VAULT_ID },
        destination: {
            type: "ONE_TIME_ADDRESS",
            oneTimeAddress: { address: contractAddress }
        },
        amount: "0",
        operation: "CONTRACT_CALL",
        note,
        extraParameters: { contractCallData: data }
    };
    return sendPostRequest("/v1/transactions", body, note);
}

/**
 * Deploys a smart contract
 */
async function deployContract(note, bytecode, constructorArgs = "") {
    const body = {
        assetId: "ETH_TEST5",
        source: { type: "VAULT_ACCOUNT", id: VAULT_ID },
        destination: {
            type: "ONE_TIME_ADDRESS",
            oneTimeAddress: { address: "0x0000000000000000000000000000000000000000" }
        },
        amount: "0",
        operation: "CONTRACT_CALL",
        note,
        extraParameters: {
            contractCallData: bytecode + constructorArgs.replace("0x", "")
        }
    };
    const result = await sendPostRequest("/v1/transactions", body, note);
    console.log(`🚀 Deployment Submitted: ${note} (ID: ${result.id})`);
    const tx = await waitForTransaction(result.id);

    if (tx.deployedAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(`CRITICAL: Address discovery failed for ${note}. Check Etherscan: https://sepolia.etherscan.io/tx/${tx.txHash}`);
    }
    return tx;
}

// --- RWA UTILS ---

function encodeInitialize(name, symbol, admin, minter, pauser, navOracle, porOracle) {
    const iface = new ethers.Interface([
        "function initialize(string name, string symbol, address admin, address minter, address pauser, address navOracle, address porOracle)"
    ]);
    return iface.encodeFunctionData("initialize", [
        name, symbol,
        admin.toLowerCase(), minter.toLowerCase(), pauser.toLowerCase(),
        navOracle.toLowerCase(), porOracle.toLowerCase()
    ]);
}

function encodeMint(to, amountEther) {
    const iface = new ethers.Interface(["function mint(address to, uint256 amount)"]);
    const amountWei = ethers.parseUnits(amountEther.toString(), 18);
    return iface.encodeFunctionData("mint", [to, amountWei]);
}

// --- MAIN FLOW ---

async function createRwaAsset(name, symbol) {
    console.log(`\n🏗️  Starting RWA Orchestration: ${name} (${symbol})`);

    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const vaultAddress = process.env.FIREBLOCKS_VAULT_ADDRESS || "0x0000000000000000000000000000000000000000";

    // 1. Oracles
    const oracleArt = require("../artifacts/contracts/RWAOracle.sol/RWAOracle.json");
    const navArgs = abiCoder.encode(["string", "uint8", "int256"], [`NAV for ${symbol}`, 8, 0]);
    const navTx = await deployContract("NAV Oracle", oracleArt.bytecode, navArgs);

    const porArgs = abiCoder.encode(["string", "uint8", "int256"], [`PoR for ${symbol}`, 18, 0]);
    const porTx = await deployContract("PoR Oracle", oracleArt.bytecode, porArgs);

    // 2. Proxy (UniqueAssetToken)
    const logicAddr = "0x22864C674176CE55a6Ac6f6B65ED54020F32CbEF"; // Central Shared Logic
    const initData = encodeInitialize(name, symbol, vaultAddress, vaultAddress, vaultAddress, navTx.deployedAddress, porTx.deployedAddress);

    const proxyArt = require("../artifacts/contracts/FireblocksProxy.sol/FireblocksProxy.json");
    const proxyArgs = abiCoder.encode(["address", "bytes"], [logicAddr, initData]);
    const proxyTx = await deployContract("Token Proxy", proxyArt.bytecode, proxyArgs);

    console.log(`\n🎉 SUCCESS!`);
    console.log(`📍 Proxy: ${proxyTx.deployedAddress}`);
    console.log(`📍 Oracles: NAV=${navTx.deployedAddress}, PoR=${porTx.deployedAddress}`);

    return proxyTx.deployedAddress;
}

async function main() {
    console.log("🔥 Fireblocks RWA Direct API v2.0");
    try {
        const proxyAddress = await createRwaAsset("Direct Asset", "DAR");

        console.log(`\n📝 Performing Initial Mint...`);
        const mintData = encodeMint("0x89e0000000000000000000000000000000000000", 100);
        const mintResult = await sendContractCall(proxyAddress, mintData, "Initial Mint");
        await waitForTransaction(mintResult.id);

        console.log("\n🎊 COMPLETE!");
    } catch (e) {
        console.error("\n❌ FAILED:", e.message);
        process.exit(1);
    }
}

main();
