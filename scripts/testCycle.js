const { ethers } = require("hardhat");
require("dotenv").config();
const provider = require("../fireblocksProvider");

async function main() {
    const tokenAddress = process.env.UNIQUE_TOKEN_PROXY;
    const signer = await provider.getSigner();

    console.log("\n🧪 STARTING RWA TEST CYCLE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Target Token: ${tokenAddress}`);

    const token = await ethers.getContractAt("UniqueAssetToken", tokenAddress, signer);

    // 1. Check current state
    console.log("\n1️⃣ Checking Current State...");
    const nav = await token.getNAV();
    const por = await token.getProofOfReserve();
    const supply = await token.totalSupply();

    console.log(`Current NAV: ${ethers.formatEther(nav)} USD`);
    console.log(`Current PoR: ${ethers.formatUnits(por, 18)} units`);
    console.log(`Current Supply: ${ethers.formatEther(supply)} UAT`);

    // 2. Mint Tokens
    const mintAmount = "5";
    console.log(`\n2️⃣ Minting ${mintAmount} UAT based on reserves...`);

    try {
        const tx = await token.mint(await signer.getAddress(), ethers.parseEther(mintAmount));
        console.log(`Transaction Sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Minting Successful!");
    } catch (error) {
        console.error("❌ Minting Failed (Possibly due to PoR/NAV constraints):", error.message);
    }

    // 3. Final Verification
    const newSupply = await token.totalSupply();
    console.log(`\n3️⃣ Final Token Supply: ${ethers.formatEther(newSupply)} UAT`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
