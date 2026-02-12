require("dotenv").config();
const provider = require("../fireblocksProvider");
const { ethers } = require("hardhat");

async function main() {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 DEPLOYING UNIQUE ASSET TOKEN (UAT) PROXY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log(`Deployer: ${signerAddress}`);

    // 1. Deploy Implementation
    console.log("\n1️⃣ Deploying Implementation logic...");
    const UniqueAssetToken = await ethers.getContractFactory("UniqueAssetToken", signer);
    const implementation = await UniqueAssetToken.deploy();
    await implementation.waitForDeployment();
    const implAddress = await implementation.getAddress();
    console.log(`✅ Implementation Address: ${implAddress}`);

    // 2. Deploy Proxy
    console.log("\n2️⃣ Deploying UUPS Proxy...");
    const FireblocksProxy = await ethers.getContractFactory("FireblocksProxy", signer);

    // Encode initialization data (5 args: admin, minter, pauser, navOracle, porOracle)
    const initData = UniqueAssetToken.interface.encodeFunctionData("initialize(address,address,address,address,address)", [
        signerAddress, // defaultAdmin
        signerAddress, // minter
        signerAddress, // pauser
        process.env.NAV_ORACLE_ETH_USD, // navOracle
        process.env.POR_ORACLE_BTC_USD  // porOracle
    ]);

    const proxy = await FireblocksProxy.deploy(implAddress, initData);
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    console.log(`✅ Proxy (Token) Address: ${proxyAddress}`);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log(`Token Name: UniqueAsset`);
    console.log(`Token Symbol: UAT`);
    console.log(`Initial Supply: 10 UAT (Minted to deployer)`);
    console.log(`Contract Address: ${proxyAddress}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("\nNext Steps:");
    console.log(`- Update .env: UNIQUE_TOKEN_PROXY=${proxyAddress}`);
    console.log(`- Run: node scripts/initUniqueOracles.js`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
