# 🔮 Deploying Oracles & Retrieving Addresses

This guide covers how to add NAV and PoR Oracles and—most crucially—how to get their contract addresses using the Fireblocks REST API.

## 1. Deploying via API
To deploy, send a `CONTRACT_CALL` to the null address.

**Payload:**
```json
{
    "assetId": "ETH_TEST5",
    "source": { "type": "VAULT_ACCOUNT", "id": "88" },
    "destination": { 
        "type": "ONE_TIME_ADDRESS", 
        "oneTimeAddress": { "address": "0x0000000000000000000000000000000000000000" } 
    },
    "operation": "CONTRACT_CALL",
    "extraParameters": { "contractCallData": "0x<BYTECODE><ARGS>" }
}
```

## 2. Getting the Contract Address
Unlike standard transactions, the address isn't in `destinationAddress`.

### Where to Look (Order of Precedence):
1.  **`contractAddress`**: The top-level field in the transaction object (most reliable).
2.  **`extraParameters.contractAddress`**: Some API versions place it here.
3.  **`extraParameters.results[0].contractAddress`**: If multiple actions occurred.

### Automatic Retrieval Logic:
```javascript
// From scripts/directApiMint.js
let foundAddress = result.contractAddress || 
                   result.extraParameters?.contractAddress || 
                   result.txReceipt?.contractAddress;
```

---

## 🚀 Pro-Tip: Manual Discovery
If the API returns `0x0` (common in some Sandbox configurations):
1. Copy the **`txHash`** from the API response.
2. Search that hash on [Sepolia Etherscan](https://sepolia.etherscan.io).
3. The "Contract Created" address is your Oracle.
