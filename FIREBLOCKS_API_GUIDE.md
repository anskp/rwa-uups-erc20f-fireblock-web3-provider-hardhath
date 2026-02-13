# 🔥 Fireblocks API Integration Guide (RWA Edition)

This document provides exact **REST API payloads** for interacting with your RWA smart contracts via Fireblocks. Use these endpoints to automate Minting, Burning, and Oracle updates from any backend (Python, Go, Node, etc.).

---

## 🔐 1. Authentication & Signing
Every request must include the following headers. Example logic for generating the `Authorization` header in Node.js:

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function signRequest(path, body = "") {
    const token = jwt.sign({
        uri: path, // e.g. "/v1/transactions"
        nonce: crypto.randomBytes(64).toString('hex'),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 55,
        sub: process.env.FIREBLOCKS_API_KEY,
        bodyHash: crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')
    }, process.env.FIREBLOCKS_SECRET_KEY, { algorithm: 'RS256' });
    return token;
}
```

**Endpoint:** `POST https://sandbox-api.fireblocks.io/v1/transactions` (Use `api.fireblocks.io` for Mainnet)

**Headers:**
```http
X-API-Key: YOUR_API_KEY
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

> [!IMPORTANT]
> The `uri` claim in the JWT must match the API path starting with `/v1`. Do not include the domain or protocol in the `uri` claim.

---

## 🏭 2. Minting Tokens
**Scenario:** Admin mints new RWA tokens to a specific investor vault.

### 📝 Request Payload
```json
{
  "assetId": "ETH_TEST5",
  "source": { "type": "VAULT_ACCOUNT", "id": "0" },
  "destination": {
    "type": "ONE_TIME_ADDRESS",
    "oneTimeAddress": { "address": "TOKEN_PROXY_ADDRESS" }
  },
  "amount": "0",
  "operation": "CONTRACT_CALL",
  "note": "Minting 500 GOLD tokens to Investor A",
  "extraParameters": {
    "contractCallData": "0x40c10f19000000000000000000000000RECIPIENT_ADDRESS00000000000000000000000000000000000000000000000006f05b59d3b20000"
  }
}
```
*   **Method ID (`mint`):** `0x40c10f19`
*   **Params**: `address to`, `uint256 amount` (scaled to 18 decimals).
*   **Asset ID**: Use `ETH_TEST5` for Sepolia.

---

## 🕯️ 3. Oracle Updates (NAV/Price)
**Scenario:** An automated script updates the Price (NAV) of an asset in the `RWAOracle` contract.

### 📝 Request Payload
```json
{
  "assetId": "ETH_TEST5",
  "source": { "type": "VAULT_ACCOUNT", "id": "0" },
  "destination": {
    "type": "ONE_TIME_ADDRESS",
    "oneTimeAddress": { "address": "0xNAV_ORACLE_ADDRESS" }
  },
  "amount": "0",
  "operation": "CONTRACT_CALL",
  "note": "Updating GOLD Price to $2,350.50",
  "extraParameters": {
    "contractCallData": "0x4d36286800000000000000000000000000000000000000000000000000000005788f6200"
  }
}
```
*   **Method ID (`updateValue`):** `0x4d362868`
*   **Params**: `int256 newValue` (scaled to 8 decimals for NAV).

---

## 🛡️ 4. Burning Tokens
**Scenario:** Burning tokens from the admin vault to reduce supply.

### 📝 Request Payload
```json
{
  "assetId": "ETH_TEST5",
  "source": { "type": "VAULT_ACCOUNT", "id": "0" },
  "destination": {
    "type": "ONE_TIME_ADDRESS",
    "oneTimeAddress": { "address": "TOKEN_PROXY_ADDRESS" }
  },
  "amount": "0",
  "operation": "CONTRACT_CALL",
  "note": "Burning 100 surplus tokens",
  "extraParameters": {
    "contractCallData": "0x42966c680000000000000000000000000000000000000000000000056bc75e2d63100000"
  }
}
```
*   **Method ID (`burn`):** `0x42966c68`
*   **Params**: `uint256 amount` (scaled to 18 decimals).

---

## 🔍 5. Checking Transaction Status
**Scenario:** After sending a request, you need to check if it was COMPLETED or FAILED.

**Endpoint:** `GET https://sandbox-api.fireblocks.io/v1/transactions/<TX_ID>`

### 🚦 Key Statuses to Watch:
*   `SUBMITTED`: Request reached Fireblocks.
*   `PENDING_SIGNATURE`: Waiting for an approver to sign in the Console.
*   `BROADCASTING`: Transaction is being sent to the blockchain.
*   `COMPLETED`: Transaction is confirmed on-chain! ✅
*   `FAILED`: Transaction was rejected or reverted. ❌

---

## 🛠️ 6. Full Script Example: `directApiMint.js`
For a complete, runnable example that handles **JWT signing**, **Hex encoding**, and **Transaction submission**, see:
[directApiMint.js](file:///c:/Users/anask/Desktop/rwa-fireblocks/scripts/directApiMint.js)

### 🚀 To run it:
1. Ensure your `.env` is setup with `FIREBLOCKS_API_KEY` and `FIREBLOCKS_VAULT`.
2. Run: `node scripts/directApiMint.js`

---
🥂🚀 **Ready for Multi-Project Integration!**
