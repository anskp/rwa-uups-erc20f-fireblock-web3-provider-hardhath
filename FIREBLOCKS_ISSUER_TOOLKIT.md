# 🏗️ Issuer & Token Orchestration Toolkit

This guide documents the full flow for a **New Issuer**, including deploying a **New Proxy (Token)** and linking **Oracles** during the process.

## 🚀 The Multi-Step Orchestration
A production RWA deployment requires linking multiple components in the correct order.

### Step 1: Deploy Oracles
Refer to `FIREBLOCKS_ORACLE_GUIDE.md` to deploy:
- **NAV Oracle**: `0xOracleAddressA`
- **PoR Oracle**: `0xOracleAddressB`

### Step 2: Set Implementation (Shared Logic)
Always use a pre-deployed `UniqueAssetToken` implementation to save over 4M gas.
- **Shared Logic**: `0x22864c674176ce55A6ac6f6b65ED54020f32cbeF`

### Step 3: Deploy & Link Proxy (Token)
When deploying the Proxy, you must encode the **`initialize`** call with the oracle addresses.

#### 🔗 Initialization Signature
`initialize(string name, string symbol, address admin, address minter, address pauser, address navOracle, address porOracle)`

**Example Payload:**
```javascript
const initData = iface.encodeFunctionData("initialize", [
    "My Asset",
    "MAS",
    "0xYourVaultAddress", // Admin
    "0xYourVaultAddress", // Minter
    "0xYourVaultAddress", // Pauser
    "0xOracleAddressA",   // <--- LINKED HERE
    "0xOracleAddressB"    // <--- LINKED HERE
]);
```

### Step 4: Token Minting
Once the Proxy is live, use the standalone script:
```bash
node scripts/mintToken.js <RECIPIENT> <AMOUNT> <PROXY_ADDRESS>
```

---

## 🛠️ Integrated Tool
The `scripts/directApiMint.js` script automates steps 1-4. It polls each transaction and extracts the addresses automatically using the logic in the guide.
