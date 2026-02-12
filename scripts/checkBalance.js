require("dotenv").config();
const provider = require("../fireblocksProvider");
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    try {
        const tokenAddress = process.env.ANAS_TOKEN_ADDRESS;
        if (!tokenAddress) throw new Error("ANAS_TOKEN_ADDRESS not found in .env");

        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();

        console.log("Checking AKP Balance for:", signerAddress);

        const artifactPath = "./artifacts/contracts/AnasToken.sol/AnasToken.json";
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

        const contract = new ethers.Contract(tokenAddress, artifact.abi, signer);

        const balance = await contract.balanceOf(signerAddress);
        const symbol = await contract.symbol();
        const name = await contract.name();

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("💎 TOKEN DATA:");
        console.log("Name:", name);
        console.log("Symbol:", symbol);
        console.log("Balance:", ethers.formatUnits(balance, 18), symbol);
        console.log("Address:", tokenAddress);
        console.log("Etherscan Link: https://sepolia.etherscan.io/address/" + tokenAddress);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    } catch (error) {
        console.error("❌ Verification failed:", error.message);
    }
}

main().catch(console.error);
