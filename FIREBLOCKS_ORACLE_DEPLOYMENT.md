# 🔮 Deploying Oracles via Fireblocks API

This guide explains how to deploy the `RWAOracle` (NAV/PoR) contracts and correctly capture their on-chain addresses using direct REST API calls.

## 1. The Deployment Payload
To deploy a contract, you send a `CONTRACT_CALL` transaction to the **Ethereum Zero Address** (`0x0000000000000000000000000000000000000000`).

**Endpoint:** `POST https://sandbox-api.fireblocks.io/v1/transactions`

```json
{
    "assetId": "ETH_TEST5",
    "source": { "type": "VAULT_ACCOUNT", "id": "YOUR_VAULT_ID" },
    "destination": { 
        "type": "ONE_TIME_ADDRESS", 
        "oneTimeAddress": { "address": "0x0000000000000000000000000000000000000000" } 
    },
    "operation": "CONTRACT_CALL",
    "amount": "0",
    "extraParameters": {
        "contractCallData": "0x<BYTECODE><ENCODED_CONSTRUCTOR_ARGS>"
    },
    "note": "Deploying NAV Oracle"
}
```

## 2. Capturing the Contract Address
Unlike standard transfers, the result of a deployment is not in the `destinationAddress`. You must poll the transaction until it is `COMPLETED`, then look for the **`contractAddress`** field.

### Automated Polling Logic (Node.js)
```javascript
async function waitForAddress(txId) {
    while (true) {
        const res = await axios.get(`https://sandbox-api.fireblocks.io/v1/transactions/${txId}`);
        const status = res.data.status;
        
        if (status === "COMPLETED") {
            // CRITICAL: Extract from contractAddress, NOT destinationAddress
            return res.data.contractAddress || res.data.extraParameters.contractAddress;
        }
        
        if (["FAILED", "REJECTED", "CANCELLED"].includes(status)) {
            throw new Error(`Transaction failed: ${status}`);
        }
        
        await new Promise(r => setTimeout(r, 5000));
    }
}
```

## 3. Required Constructor Arguments
The `RWAOracle` requires three arguments:
1. `description` (string)
2. `decimalsValue` (uint8) - Use **8** for NAV, **18** for PoR.
3. `initialValue` (int256) - Usually **0**.

Encapsulate these using `ethers.AbiCoder` before appending to the bytecode.
