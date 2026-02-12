require("dotenv").config();
const provider = require("../fireblocksProvider");
const { ethers } = require("hardhat");

async function main() {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🛠 INITIALIZING UNIQUE ASSET TOKEN (UAT) ORACLES");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const tokenAddress = process.env.UNIQUE_TOKEN_PROXY;
    if (!tokenAddress) {
        throw new Error("UNIQUE_TOKEN_PROXY not found in .env");
    }

    const navOracle = process.env.NAV_ORACLE_ETH_USD;
    const porOracle = process.env.POR_ORACLE_BTC_USD;

    const signer = await provider.getSigner();
    const UniqueAssetToken = await ethers.getContractAt("UniqueAssetToken", tokenAddress, signer);

    console.log(`Token Address: ${tokenAddress}`);
    console.log(`Setting NAV Oracle: ${navOracle}`);
    console.log(`Setting PoR Oracle: ${porOracle}`);

    const tx = await UniqueAssetToken.setupOracles(navOracle, porOracle);
    console.log("⏳ Waiting for transaction confirmation...");
    await tx.wait();

    console.log("✅ ORACLES CONFIGURED SUCCESSFULLY!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
