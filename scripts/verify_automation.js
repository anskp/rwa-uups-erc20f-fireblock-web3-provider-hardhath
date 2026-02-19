require("dotenv").config();
const hre = require("hardhat");

/**
 * Automation script to verify JIT-orchestrated RWA tokens on Etherscan.
 * This unlocks the "Read as Proxy" and "Write as Proxy" tabs.
 */
async function main() {
    // --- TARGET TOKEN DATA ---
    const data = {
        name: "Luxury Villa Dubai",
        symbol: "LVD",
        address: "0x117Ae605bD01027cAdD6155D1a1176F774Dc7b97",
        nav: "0x356e56a66e8F261bFd931a684eA0997B8Ad94D9F",
        por: "0xEc14B1DFdb970c261D63cd3D34eC5ABea6F075Ca",
        admin: "0x16a7460178ad3E5fE57B4A07b4e5DfeB7E16f144",
        implementation: "0xE47bE2d9e49F281Db51c52B8cae21C9E700a923F"
    };

    console.log("\n🚀 Starting Automation Verification for: " + data.name);
    console.log(`📍 Proxy: ${data.address}`);
    console.log(`⚙️  Implementation: ${data.implementation}`);

    // 1. Get Contract Factory
    const UniqueAssetToken = await hre.ethers.getContractFactory("UniqueAssetToken");

    // 2. Encode Initialization Data
    // We MUST use the full signature to avoid ambiguity with overloaded 'initialize' functions
    console.log(`\n📦 Encoding initialization data...`);
    const initData = UniqueAssetToken.interface.encodeFunctionData(
        "initialize(string,string,address,address,address,address,address)",
        [
            data.name,
            data.symbol,
            data.admin, // defaultAdmin
            data.admin, // minter
            data.admin, // pauser
            data.nav,
            data.por
        ]
    );

    // 3. Run Verification
    // Constructor for FireblocksProxy (which inherits ERC1967Proxy) is:
    // constructor(address _logic, bytes memory _data)
    console.log(`\n🛰️  Submitting to Etherscan...`);

    try {
        await hre.run("verify:verify", {
            address: data.address,
            constructorArguments: [data.implementation, initData],
            contract: "contracts/FireblocksProxy.sol:FireblocksProxy"
        });
        console.log("\n✅ VERIFICATION COMPLETE!");
        console.log(`🔗 Link: https://sepolia.etherscan.io/address/${data.address}#code`);
        console.log("\n✨ The 'Read/Write as Proxy' tabs should now be visible on Etherscan.");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("\nℹ️  Notice: Contract is already verified on Etherscan.");
        } else {
            console.error("\n❌ Verification failed:", error.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
