require("dotenv").config();
const hre = require("hardhat");

/**
 * Generic JIT Verification Script
 * usage: npx hardhat run scripts/verify_jit.js --network sepolia
 * environment variables expected: JIT_VERIFY_DATA (JSON string)
 */
async function main() {
    const rawData = process.env.JIT_VERIFY_DATA;
    if (!rawData) {
        console.error("❌ No JIT_VERIFY_DATA found in environment");
        return;
    }

    const data = JSON.parse(rawData);
    console.log(`\n🚀 Starting Auto-Verification for: ${data.name} (${data.address})`);

    const UniqueAssetToken = await hre.ethers.getContractFactory("UniqueAssetToken");

    // 1. Encode Init Data
    const initData = UniqueAssetToken.interface.encodeFunctionData(
        "initialize(string,string,address,address,address,address,address)",
        [
            data.name,
            data.symbol,
            data.admin,
            data.admin,
            data.admin,
            data.nav,
            data.por
        ]
    );

    // 2. Verify Oracles (if provided and not already verified)
    if (data.nav) {
        try { await hre.run("verify:verify", { address: data.nav }); } catch (e) { }
    }
    if (data.por) {
        try { await hre.run("verify:verify", { address: data.por }); } catch (e) { }
    }

    // 3. Verify Proxy
    try {
        await hre.run("verify:verify", {
            address: data.address,
            constructorArguments: ["0xE47bE2d9e49F281Db51c52B8cae21C9E700a923F", initData],
            contract: "contracts/FireblocksProxy.sol:FireblocksProxy"
        });
        console.log(`✅ ${data.name} verified successfully!`);
    } catch (error) {
        console.log(`ℹ️  Verification status: ${error.message}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
