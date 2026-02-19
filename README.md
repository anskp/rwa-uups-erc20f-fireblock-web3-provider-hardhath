# Fireblocks RWA Token Project 🚀

Professional implementation of an enterprise-grade, upgradeable fungible RWA (Real World Asset) token using the **Fireblocks ERC20F** standard and **UUPS (Universal Upgradeable Proxy Standard)** pattern.

## 🏗 Architecture Overview

The project leverages Fireblocks' secure MPC infrastructure for transaction signing and contract management.

-   **Base Layer**: `ERC20F.sol` (Fireblocks Standard) - Handles role-based access control, salvageability, and basic ERC20 logic.
-   **RWA Extension**: `RWATokenUpgradeable.sol` - Inherits `ERC20F` and adds:
    -   **Net Asset Value (NAV)**: Integrated via Chainlink Price Feeds.
    -   **Proof of Reserve (PoR)**: Verified via Chainlink Oracles.
    -   **RWA Freezing**: Ability to freeze transfers for compliance.
    -   **Metadata URI**: Flexible metadata management for asset documentation.
-   **Security**: All transactions are signed via **Fireblocks Sandbox** using RSA keys.

## 🔑 Environment Configuration

Create a `.env` file in the root directory:

```env
FIREBLOCKS_API_KEY=your_api_key_here
FIREBLOCKS_VAULT=your_vault_id
FIREBLOCKS_API_PRIVATE_KEY_PATH=./fireblocks_secret.key

# Sepolia Deployment Addresses
RWA_IMPLEMENTATION_ADDRESS=0x246274fD9C30C0B6e3962C1674f402995779EFf2
RWA_PROXY_ADDRESS=0xcf0f6D61Eeaddcd2Cbc9868d05d462f2C08bC67b
```

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Compilation
```bash
npx hardhat compile
```

### 3. Deployment (UUPS Proxy)
To deploy a new instance:
```bash
node scripts/deployProxy.js
```

### 4. Initialization
To set up oracles and metadata on a newly deployed proxy:
```bash
node scripts/initializeRWA.js
```

## 🪙 Token Operations

### Minting AKP Tokens
To mint 100 AKP tokens to your vault:
```bash
node scripts/mintAKP.js
```

### Checking Oracle Status (NAV & PoR)
To view the real-time on-chain oracle data:
```bash
node scripts/checkOracles.js
```

---

## 🧙‍♂️ RWA Wizard

The **RWA Wizard** is an interactive CLI tool designed to deploy a full asset stack (Oracles + Proxy + Initial Mint) in one go.

### Usage
```bash
npx hardhat run scripts/RWA_Wizard.js
```
*Note: Always use `npx hardhat run` to ensure the Fireblocks Ethers provider is correctly initialized.*

### 🛠️ Technical Fixes Applied
- **Checksum Enforcement**: All addresses are normalized to **EIP-55** via `ethers.getAddress` to prevent "bad address checksum" errors on Sepolia.
- **Ambiguity Resolution**: The initialization of the `UniqueAssetToken` proxy uses the full function signature `initialize(string,string,address,address,address,address,address)` to distinguish between overloaded versions in the ABI.
- **Dynamic Artifact Loading**: Scripts now load contract artifacts dynamically from `artifacts/` rather than using hardcoded bytecode strings, ensuring consistency with recent compilations.
- **Implementation Pinning**: The project uses a verified implementation at `0xE47bE2d9e49F281Db51c52B8cae21C9E700a923F` found via ERC1967 storage slot analysis.

---

## 🏢 Simplified AnasToken (Non-Upgradeable)

- **Name**: `anas`
- **Symbol**: `AKP`
- **Initial Supply**: 55 (Minted to deployer)
- **Features**: Direct Chainlink Oracle integration + **On-Chain Pricing Management**.

### Commands for AnasToken:
```bash
# 1. Deploy (One-time)
node scripts/deployAnas.js

# 2. Add Pricing (Mock/Manual Data)
# Sets the on-chain price to $1,500.00
node scripts/setAnasMockPrice.js

# 3. Check Oracles & Pricing
node scripts/checkAnasOracles.js
```

## 🛠 Project Scripts

| Script | Description |
| :--- | :--- |
| `deployAnas.js` | Deploys the simplified AnasToken with 55 AKP supply. |
| `setAnasMockPrice.js` | Sets a manual on-chain price (e.g. $1,500) for the token. |
| `checkAnasOracles.js` | Fetches NAV/PoR and the Manual Price for AnasToken. |
| `deployProxy.js` | Deploys Implementation + UUPS Proxy (Legacy). |
| `upgradeProxy.js` | Upgrades Proxy logic (Legacy). |
| `initializeRWA.js` | Configures oracles for Proxy (Legacy). |
| `mintAKP.js` | Mint script for Proxy version (Legacy). |

## 📐 Chainlink Oracles (Sepolia)
- **NAV**: ETH/USD (`0x694AA1...`)
- **PoR**: BTC/USD (`0x1b44F3...`)

## ⚖ License
AGPL-3.0-or-later
