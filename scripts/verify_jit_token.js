require("dotenv").config();
const hre = require("hardhat");

async function main() {
    const proxyAddress = "0x117Ae605bD01027cAdD6155D1a1176F774Dc7b";
    const implementationAddress = "0xE47bE2d9e49F281Db51c52B8cae21C9E700a923F";
    const name = "Luxury Villa Dubai";
    const symbol = "LVD";
    const admin = "0x16a7460178ad3E5fE57B4A07b4e5DfeB7E16f144";
    const navOracle = "0xCe854cCF56015A82e5F267ffFf30024cdAd6562A";
    const porOracle = "0x8BC643568Dff0a6Fd3529020aBb7e40E0dAAcaF9";

    const UniqueAssetToken = await hre.ethers.getContractFactory("UniqueAssetToken");

    console.log(`\nEncoding initialization...`);
    const initData = UniqueAssetToken.interface.encodeFunctionData(
        "initialize(string,string,address,address,address,address,address)",
        [name, symbol, admin, admin, admin, navOracle, porOracle]
    );

    console.log(`\n--- Verification Task ---`);
    console.log(`Proxy: ${proxyAddress}`);
    console.log(`Constructor Args: [${implementationAddress}, ${initData.substring(0, 20)}...]`);

    try {
        await hre.run("verify:verify", {
            address: proxyAddress,
            constructorArguments: [implementationAddress, initData],
        });
        console.log("✅ Proxy Verified successfully!");
    } catch (error) {
        console.error("❌ Proxy verification failed:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
