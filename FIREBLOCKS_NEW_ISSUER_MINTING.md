# 🏗️ New Issuer & Token Orchestration

This guide tracks the full lifecycle of creating a new RWA Issuer: Deploy Oracles -> Shared Logic -> Proxy (Token) -> Initial Mint.

## 🚀 Orchestration Workflow

### Step 1: Deploy Oracles
Deploy two instances of `RWAOracle.sol`. 
- **NAV Oracle**: Usually 8 decimals.
- **PoR Oracle**: Usually 18 decimals.
- *Capture both addresses using the `contractAddress` field.*

### Step 2: Utilize Shared Logic
To save gas, refer to a previously deployed `UniqueAssetToken` implementation.
- **Shared Address**: `0x22864C674176CE55a6Ac6f6B65ED54020f32CbEF`

### Step 3: Deploy & Link Proxy
Deploy `FireblocksProxy.sol`. The constructor takes the **Logic Address** and **Initialization Data**.

#### 🔗 Linking Oracles in Initialization
The `initialize` function must include the oracle addresses to link them to the token immediately.

**ABI Signature:**
`initialize(string name, string symbol, address admin, address minter, address pauser, address navOracle, address porOracle)`

**Example Initialization Payload (Encoded):**
```javascript
const initData = iface.encodeFunctionData("initialize", [
    "My Asset",
    "MAS",
    adminAddress,
    minterAddress,
    pauserAddress,
    navOracleAddress, // <--- Linked here
    porOracleAddress  // <--- Linked here
]);
```

### Step 4: Initial Mint
Once the Proxy (your Token) is deployed, call its `mint` function.

**Target Address:** Your newly deployed Proxy address.
**Data:** `encodeMint(recipient, amount)`

---

## 🛠️ Tools
Use `scripts/directApiMint.js` to run this entire flow automatically.
- **Auto-Polling**: Tracks all 4-5 transactions to completion.
- **Checksum Normalization**: Automatically handles EIP-55 address validation.
