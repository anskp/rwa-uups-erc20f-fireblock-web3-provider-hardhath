# 📜 Smart Contract ABI Guide

This guide provides the **ABI (Application Binary Interface)** for your UniqueAssetToken. The ABI is the "Interface" that allows your frontend, Fireblocks, or scripts to talk to the smart contract.

## 📍 Contract Addresses
- **Proxy (Talk to this!)**: `0x0f11988D7E5bFF6732F1f6c209F7D413e04CbfF4`
- **Implementation (Logic)**: `0x5761bE7C4fc114Bb81C4f3fec0b595B8bd58C8f7`

---

## 🔑 Key Functions (Quick Reference)

| Function | Purpose |
| :--- | :--- |
| `balanceOf(address)` | Check how many UAT tokens an account holds. |
| `transfer(to, amount)` | Send UAT tokens to another address. |
| `mint(to, amount)` | Create new tokens (Minter Role required). |
| `burn(amount)` | Destroy your own tokens. |
| `getNAV()` | Get the Net Asset Value from the Chainlink Oracle. |
| `getProofOfReserve()` | Get the Proof of Reserve from the Chainlink Oracle. |
| `setupOracles(nav, por)` | Update the oracle addresses (Admin only). |

---

## 🏗️ How to find the Fullerton ABI JSON
The full, technical JSON is stored in your project at:
`artifacts/contracts/UniqueAssetToken.sol/UniqueAssetToken.json`

### 📋 Full ABI JSON (Copy for Frontend)
If you are building a React/Web3 app, you can copy the array below:

```json
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "defaultAdmin", "type": "address" },
      { "internalType": "address", "name": "minter", "type": "address" },
      { "internalType": "address", "name": "pauser", "type": "address" }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNAV",
    "outputs": [{ "internalType": "int256", "name": "", "type": "int256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProofOfReserve",
    "outputs": [{ "internalType": "int256", "name": "", "type": "int256" }],
    "stateMutability": "view",
    "type": "function"
  }
]
```
*(Note: This is a simplified version. Use the full file in the `artifacts` folder for events and advanced roles.)*

---

## 🔔 Key Events
- `Transfer(from, to, value)`: Emitted whenever tokens move.
- `RoleGranted(role, account, sender)`: Emitted when permissions are changed.
- `Initialized(version)`: Emitted when the contract is first set up.

---
🥂🚀 **Happy Integrating!**
