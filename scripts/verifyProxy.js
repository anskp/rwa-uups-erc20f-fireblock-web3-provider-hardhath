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
    const proxyAddress = process.env.UNIQUE_TOKEN_PROXY;
    const implementationAddress = process.env.UAT_IMPLEMENTATION_ADDRESS;
    const admin = "0x5821262dE6B9705E333333333333333333333333"; // User's signer address from earlier logs
    const navOracle = process.env.NAV_ORACLE_ETH_USD;
    const porOracle = process.env.POR_ORACLE_BTC_USD;

    if (!proxyAddress || !implementationAddress) {
        console.error("❌ UNIQUE_TOKEN_PROXY or UAT_IMPLEMENTATION_ADDRESS not found in .env");
        return;
    }

    console.log("\n🚀 UNLOCKING ETHERSCAN ABI...");
    console.log(`Proxy: ${proxyAddress}`);
    console.log(`Implementation: ${implementationAddress}`);

    // 1. Verify Implementation first (it might already be verified)
    await verify(implementationAddress);

    // 2. Verify Proxy with actual initialization data
    const UniqueAssetToken = await ethers.getContractFactory("UniqueAssetToken");

    // We get the actual signer address from hardhat to be safe
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();

    console.log(`\nEncoding initialization with:
- Admin/Minter/Pauser: ${signerAddress}
- NAV Oracle: ${navOracle}
- PoR Oracle: ${porOracle}
`);

    const initData = UniqueAssetToken.interface.encodeFunctionData("initialize(address,address,address,address,address)", [
        signerAddress, // defaultAdmin
        signerAddress, // minter
        signerAddress, // pauser
        navOracle,
        porOracle
    ]);

    await verify(proxyAddress, [implementationAddress, initData]);

    console.log("\n✨ NEXT STEP: Go to Etherscan, click the 'Contract' tab, then 'More Options' -> 'Is this a proxy?' -> 'Verify'");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
