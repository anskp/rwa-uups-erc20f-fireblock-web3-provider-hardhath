require("dotenv").config();
const { ethers } = require("hardhat");
const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function verify(address, constructorArgs = []) {
    console.log(`\n🔍 Verifying contract at ${address}...`);
    try {
        const argsString = constructorArgs.length > 0 ? ` ${constructorArgs.map(a => `"${a}"`).join(" ")}` : "";
        const command = `npx hardhat verify --network sepolia ${address}${argsString}`;
        console.log(`Running: ${command}`);
        execSync(command, { stdio: "inherit" });
        console.log(`✅ Verified ${address}`);
    } catch (error) {
        console.log(`❌ Notification: ${address} might already be verified or failed: ${error.message}`);
    }
}

async function main() {
    console.log("\n🔍 RWA PROXY VERIFICATION TOOL");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Find all symbols in .env
    const symbols = Object.keys(process.env)
        .filter(k => k.endsWith("_PROXY"))
        .map(k => k.replace("_PROXY", ""));

    console.log("Tokens found in .env:", symbols.join(", "));
    const symbol = await question("\nWhich token symbol do you want to verify on Etherscan? (e.g. ROL): ");
    const SYM = symbol.toUpperCase();

    const proxyAddress = process.env[`${SYM}_PROXY`];
    const implAddress = process.env[`${SYM}_IMPLEMENTATION`];
    const navOracle = process.env[`${SYM}_NAV_ORACLE`];
    const porOracle = process.env[`${SYM}_POR_ORACLE`];

    if (!proxyAddress || !implAddress) {
        console.error(`❌ Could not find proxy/implementation for ${SYM} in .env`);
        process.exit(1);
    }

    console.log(`\n🚀 Processing ${SYM}...`);
    console.log(`Proxy: ${proxyAddress}`);
    console.log(`Implementation: ${implAddress}`);

    // 1. Verify Implementation
    console.log("\nStep 1: Verifying Implementation (Logic)...");
    await verify(implAddress);

    // 2. Encode Init Data
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    const name = "sunfeast"; // We might want to store this in .env too, but for now we look at the proxy's current state or use hardcoded name if it's the specific one.
    // Better: We try to read it from the contract!

    console.log("\nStep 2: Fetching Token Metadata from Blockchain...");
    const token = await ethers.getContractAt("UniqueAssetToken", proxyAddress);
    let tokenName, tokenSymbol;
    try {
        tokenName = await token.name();
        tokenSymbol = await token.symbol();
    } catch (e) {
        console.log("⚠️ Could not read name/symbol from contract. Using defaults.");
        tokenName = "RWA Token";
        tokenSymbol = SYM;
    }

    console.log(`   - Name: ${tokenName}`);
    console.log(`   - Symbol: ${tokenSymbol}`);

    console.log("\nStep 3: Verifying Proxy (Identity)...");
    const UniqueAssetToken = await ethers.getContractFactory("UniqueAssetToken");
    const initData = UniqueAssetToken.interface.encodeFunctionData("initialize(string,string,address,address,address,address,address)", [
        tokenName,
        tokenSymbol,
        signerAddress,
        signerAddress,
        signerAddress,
        navOracle,
        porOracle
    ]);

    await verify(proxyAddress, [implAddress, initData]);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✨ FINAL MANUAL STEP (REQUIRED BY ETHERSCAN):");
    console.log(`1. Go to: https://sepolia.etherscan.io/address/${proxyAddress}#code`);
    console.log(`2. Click 'More Options' (button with three dots).`);
    console.log(`3. Click 'Is this a proxy?'.`);
    console.log(`4. Click 'Verify'.`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Once done, the 'Read as Proxy' tab will appear with all your methods!");

    rl.close();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
