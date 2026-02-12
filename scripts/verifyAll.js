require("dotenv").config();
const { ethers } = require("hardhat");
const { execSync } = require("child_process");

async function verify(address, constructorArgs = []) {
    console.log(`\n🔍 Verifying contract at ${address}...`);
    try {
        const argsString = constructorArgs.length > 0 ? ` ${constructorArgs.map(a => `"${a}"`).join(" ")}` : "";
        const command = `npx hardhat verify --network sepolia ${address}${argsString}`;
        console.log(`Running: ${command}`);
        execSync(command, { stdio: "inherit" });
        console.log(`✅ Verified ${address}`);
    } catch (error) {
        console.log(`❌ Failed to verify ${address}: ${error.message}`);
    }
}

async function main() {
    const signer = (await ethers.getSigners())[0];
    const signerAddress = await signer.getAddress();
    console.log(`Using signer: ${signerAddress}`);

    // --- UNIQUE ASSET TOKEN (UAT) ---
    const uatProxy = process.env.UNIQUE_TOKEN_PROXY;
    if (uatProxy) {
        // Implementation for UAT (from logs)
        const uatImpl = "0x4Bc57beF90cAA72CF1bD37c586fE6De1148B0806";

        console.log("\n--- UniqueAssetToken (UAT) ---");
        // 1. Implementation
        await verify(uatImpl);

        // 2. Proxy
        const UniqueAssetToken = await ethers.getContractFactory("UniqueAssetToken");
        const initData = UniqueAssetToken.interface.encodeFunctionData("initialize(address,address,address)", [
            signerAddress, signerAddress, signerAddress
        ]);
        await verify(uatProxy, [uatImpl, initData]);
    }

    // --- RWATOKEN ---
    const rwaProxy = process.env.RWA_PROXY_ADDRESS;
    const rwaImpl = process.env.RWA_IMPLEMENTATION_ADDRESS;
    if (rwaProxy && rwaImpl) {
        console.log("\n--- RWAToken ---");
        // 1. Implementation
        await verify(rwaImpl);

        // 2. Proxy
        const RWAToken = await ethers.getContractFactory("RWATokenUpgradeable");
        const initData = RWAToken.interface.encodeFunctionData("initialize(string,string,address,address,address)", [
            "Real World Asset", "RWA", signerAddress, signerAddress, signerAddress
        ]);
        await verify(rwaProxy, [rwaImpl, initData]);
    }

    // --- ANAS TOKEN ---
    const anasTokenAd = process.env.ANAS_TOKEN_ADDRESS;
    if (anasTokenAd) {
        console.log("\n--- AnasToken ---");
        await verify(anasTokenAd);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
