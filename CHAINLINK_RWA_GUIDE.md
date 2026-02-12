# 🔗 Chainlink RWA Oracle Guide: NAV, PoR & CRE

This document explains how **Chainlink Oracles** act as the bridge between your Real-World Assets (RWA) and the Ethereum blockchain, specifically focusing on **NAV**, **PoR**, and the **Chainlink Runtime Environment (CRE)**.

---

## 🏗️ 1. How Chainlink Works (The Architecture)

Chainlink is a **Decentralized Oracle Network (DON)**. Since smart contracts cannot access data outside their own blockchain, Chainlink nodes fetch off-chain data (like gold prices or bank balances), verify it, and "push" it onto the blockchain for your contract to read.

### 🧩 Key Components in Your Project:
1.  **AggregatorV3Interface**: The standard software "plug" used in `UniqueAssetToken.sol` to read live data.
2.  **Oracle Feed**: A specific address on Sepolia that holds the current verified value.

---

## 💰 2. NAV (Net Asset Value)
**Net Asset Value** is the total value of your fund or asset minus its liabilities. 

- **How it works**: A Chainlink node tracks the valuation of your physical assets (e.g., real estate or a startup's equity) from trusted financial APIs.
- **Where to add**: In your contract `UniqueAssetToken.sol`, this is handled by the `navOracle` variable.
- **Usage**:
  ```solidity
  int navPrice = getNAV(); // Fetches live RWA value in USD
  ```

---

## 🛡️ 3. PoR (Proof of Reserve)
**Proof of Reserve** provides transparency by proving that the digital tokens you've minted are backed 1:1 by physical collateral.

- **How it works**: Chainlink verifies that the "Vault" (off-chain) has the assets before allowing the "Tokens" (on-chain) to be used.
- **Implementation**: We use the `porOracle` in your [UniqueAssetToken.sol](file:///c:/Users/anask/Desktop/rwa-fireblocks/contracts/UniqueAssetToken.sol).
- **Security Guard**: You can use PoR to prevent "Infinite Mint" bugs by requiring that `TotalSupply <= ProofOfReserve`.

---

## ⚙️ 4. CRE (Chainlink Runtime Environment)
**CRE** is the modern "Orchestration Layer" for institutions. 

- **What it is**: It’s the "Glue" that connects your token to off-chain banking systems, custodians, and compliance engines.
- **Why use it**: CRE allows your contract to trigger complex workflows, such as checking a bank's KYC database before a transfer happens.
- **Story Mode**: If the **Proxy** is the heart and the **Token** is the brain, **CRE** is the nervous system connecting the token to the real-world financial world.

---

## 📋 5. FAQs (Real Data from Chainlink)

**Q: How accurate is the NAV data?**
> **A:** Chainlink uses multiple independent nodes that fetch data from different sources (like Bloomberg or Reuters). The data is only pushed on-chain if a majority of nodes agree, making it extremely difficult to manipulate.

**Q: What happens if the Oracle goes down?**
> **A:** Chainlink feeds are decentralized across many nodes. If one node fails, the others continue providing data. Most RWA contracts also include a "Heartbeat" (e.g., 3600s) that ensures data is updated at least once per hour.

**Q: Can anyone change my Oracle addresses?**
> **A:** No. In your contract, only the `DEFAULT_ADMIN_ROLE` (your Fireblocks Vault) can call `setupOracles()` to change the feeds.

**Q: Does Chainlink work with regulated banks?**
> **A:** Yes. Chainlink has partnered with major institutions like **DTCC** and **Swift** to use the **CRE** for cross-border tokenized asset movements.

---

## 💻 Technical Integration Location
In your project, the Chainlink logic is centralized in:
📂 **File**: `contracts/UniqueAssetToken.sol`
🛠️ **Function**: `setupOracles(navAddress, porAddress)`

### 📍 Current Test Addresses (Sepolia):
- **NAV (ETH/USD)**: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- **PoR (BTC/USD used as mock)**: `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`

---
🥂🚀 **Your RWA token is now digitally connected to the real world!**
