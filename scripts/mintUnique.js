require("dotenv").config();
const provider = require("../fireblocksProvider");
const { ethers } = require("hardhat");

async function main() {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💰 MINTING UNIQUE ASSET TOKEN (UAT)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const tokenAddress = process.env.UNIQUE_TOKEN_PROXY;
    if (!tokenAddress) {
        throw new Error("UNIQUE_TOKEN_PROXY not found in .env");
    }

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const token = await ethers.getContractAt("UniqueAssetToken", tokenAddress, signer);

    const amount = 10; // Amount to mint
    console.log(`Token Address: ${tokenAddress}`);
    console.log(`Minting ${amount} UAT to: ${signerAddress}`);

    const tx = await token.mint(signerAddress, ethers.parseEther(amount.toString()));
    console.log("⏳ Waiting for transaction confirmation...");
    await tx.wait();

    const balance = await token.balanceOf(signerAddress);
    console.log(`✅ SUCCESS! New Balance: ${ethers.formatEther(balance)} UAT`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
