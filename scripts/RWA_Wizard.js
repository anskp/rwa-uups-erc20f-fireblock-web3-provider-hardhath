const { ethers } = require("hardhat");
const readline = require("readline");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const provider = require("../fireblocksProvider");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("\n🧙‍♂️ WELCOME TO THE RWA DEPLOYMENT WIZARD (SUPER PLATFORM EDITION)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const name = await question("Token Name (e.g., Cadburry): ");
    const symbol = await question("Token Symbol (e.g., CHO): ");

    console.log("\n📊 Real-World Data Setup");
    const initialNav = await question("What is the Initial Price (NAV) in USD? (e.g., 400): ");
    const initialPor = await question("What are the Initial Reserves (PoR)? (e.g., 1000000): ");

    const initialSupply = await question("\nHow many tokens to mint to your vault immediately? (e.g., 10): ");

    console.log("\n📝 SUMMARY OF YOUR NEW ASSET");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Name:        ${name}`);
    console.log(`Symbol:      ${symbol}`);
    console.log(`Initial NAV: $${initialNav}`);
    console.log(`Initial PoR: ${initialPor} Units`);
    console.log(`Initial Mint: ${initialSupply} ${symbol}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const confirm = await question("\nLaunch this asset on Sepolia via Fireblocks? (y/n): ");
    if (confirm.toLowerCase() !== 'y') {
        console.log("Deployment cancelled.");
        process.exit(0);
    }

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    // 1. Deploy Oracles
    console.log("\n🚀 Step 1: Deploying Dedicated Chainlink-Compatible Oracles...");
    const RWAOracle = await ethers.getContractFactory("RWAOracle", signer);

    console.log(`   - Deploying NAV Oracle for ${symbol}...`);
    // Scale to 8 decimals (standard Chainlink price feed)
    const navValue = ethers.parseUnits(initialNav, 8);
    const navOracle = await RWAOracle.deploy(`${name} NAV Feed`, 8, navValue);
    await navOracle.waitForDeployment();
    const navOracleAddress = await navOracle.getAddress();

    console.log(`   - Deploying PoR Oracle for ${symbol}...`);
    // Scale to 18 decimals (standard reserve feed)
    const porValue = ethers.parseUnits(initialPor, 18);
    const porOracle = await RWAOracle.deploy(`${name} PoR Feed`, 18, porValue);
    await porOracle.waitForDeployment();
    const porOracleAddress = await porOracle.getAddress();

    console.log(`✅ Oracles Ready: NAV(${navOracleAddress}), PoR(${porOracleAddress})`);

    // 2. Deploy Implementation (UniqueAssetToken handles the logic)
    console.log("\n🚀 Step 2: Deploying Token Logic (Implementation)...");
    const UniqueAssetToken = await ethers.getContractFactory("UniqueAssetToken", signer);
    const implementation = await UniqueAssetToken.deploy();
    await implementation.waitForDeployment();
    const implAddress = await implementation.getAddress();
    console.log(`✅ Logic Deployed: ${implAddress}`);

    // 3. Deploy Proxy
    console.log("\n🚀 Step 3: Launching Token Identity (Proxy)...");
    const initData = UniqueAssetToken.interface.encodeFunctionData("initialize(string,string,address,address,address,address,address)", [
        name,
        symbol,
        signerAddress,
        signerAddress,
        signerAddress,
        navOracleAddress,
        porOracleAddress
    ]);

    const FireblocksProxy = await ethers.getContractFactory("FireblocksProxy", signer);
    const proxy = await FireblocksProxy.deploy(implAddress, initData);
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    console.log(`✅ Token Live at: ${proxyAddress}`);

    // 4. Initial Mint
    console.log(`\n🚀 Step 4: Minting ${initialSupply} tokens to your vault...`);
    const token = await ethers.getContractAt("UniqueAssetToken", proxyAddress, signer);
    const mintTx = await token.mint(signerAddress, ethers.parseEther(initialSupply));
    console.log(`Transaction Sent: ${mintTx.hash}`);
    await mintTx.wait();
    console.log("✅ Minting Successful!");

    // 5. Update .env
    console.log("\n💾 Step 5: Updating Platform Registry (.env)...");
    const envPath = path.join(__dirname, "../.env");
    const newEntry = `
# --- ASSET: ${name} (${symbol}) ---
${symbol}_PROXY=${proxyAddress}
${symbol}_IMPLEMENTATION=${implAddress}
${symbol}_NAV_ORACLE=${navOracleAddress}
${symbol}_POR_ORACLE=${porOracleAddress}
`;
    fs.appendFileSync(envPath, newEntry);
    console.log("✅ .env updated.");

    console.log("\n📡 STEP 6: ORACLE INTEGRATION (For your CRE Team)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`To feed live data into these oracles, update your CRE config with:`);
    console.log(`- TARGET_NAV_ORACLE: ${navOracleAddress}`);
    console.log(`- TARGET_POR_ORACLE: ${porOracleAddress}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("\n🎉 ALPHA LAUNCH COMPLETE!");
    console.log(`Etherscan: https://sepolia.etherscan.io/address/${proxyAddress}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    rl.close();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
