const { ethers } = require("hardhat");
const readline = require("readline");
require("dotenv").config();
const provider = require("../fireblocksProvider");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("\n⚡ FIREBLOCKS RWA MINTING CONSOLE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 1. Identify Tokens
    const symbols = Object.keys(process.env)
        .filter(k => k.endsWith("_PROXY"))
        .map(k => k.replace("_PROXY", ""));

    if (symbols.length === 0) {
        console.error("❌ No tokens found in .env. Run RWA_Wizard.js first!");
        process.exit(1);
    }

    console.log("Available Tokens:", symbols.join(", "));
    const symbol = await question("\nWhich token symbol to mint? (e.g. ROL): ");
    const SYM = symbol.toUpperCase();

    const proxyAddress = process.env[`${SYM}_PROXY`];
    if (!proxyAddress) {
        console.error(`❌ Could not find address for ${SYM}`);
        process.exit(1);
    }

    const amount = await question(`How many ${SYM} to mint? `);
    const toAddress = await question(`Recipient Address (Leave empty for YOUR vault): `);

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const recipient = toAddress || signerAddress;

    console.log(`\n📝 MINTING PREVIEW`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Token:      ${SYM} (${proxyAddress})`);
    console.log(`Amount:     ${amount} ${SYM}`);
    console.log(`Recipient:  ${recipient}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const confirm = await question("\nExecute transaction via Fireblocks? (y/n): ");
    if (confirm.toLowerCase() !== 'y') {
        console.log("Cancelled.");
        process.exit(0);
    }

    const token = await ethers.getContractAt("UniqueAssetToken", proxyAddress, signer);

    console.log("\n🚀 Requesting Fireblocks Signature...");
    try {
        const tx = await token.mint(recipient, ethers.parseEther(amount));
        console.log(`📡 Transaction Broadcasted!`);
        console.log(`TX Hash: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        await tx.wait();
        console.log("\n✅ SUCCESS: Tokens are now in the vault!");
    } catch (error) {
        console.error("\n❌ MINTING FAILED:", error.message);
    }

    rl.close();
}

main().catch(console.error);
