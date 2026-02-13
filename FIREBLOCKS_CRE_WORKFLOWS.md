# ⚙️ Fireblocks Workflows: TAP vs. CRE

This guide explains how transactions are authorized and authorized in the Fireblocks environment.

## 1. The Transaction Lifecycle
When you run `scripts/directApiMint.js`, the script initiates a request. The transaction then enters a "Workflow" within Fireblocks:
1.  **SUBMITTED**: The request has reached Fireblocks.
2.  **PENDING_AUTHORIZATION**: The transaction is waiting for rules or people to approve it.
3.  **SIGNING**: The transaction is being signed by the Fireblocks Enclave (and your local co-signer if applicable).
4.  **BROADCASTING**: The signed transaction is sent to the blockchain.
5.  **COMPLETED**: The transaction is confirmed on-chain.

---

## 2. TAP: Transaction Authorization Policy
**TAP** consists of the "Human Rules" set in your Fireblocks Console.
- **Example**: "Any contract call to the RWA Proxy requires approval from both the CFO and the Security Lead."
- **Execution**: Fireblocks manages this entirely on their servers. No nodes are required on your end.

---

## 3. CRE: Configurable Rules Engine
**CRE** is an "Automated Co-Signer" or "Code-based Approver."
- **How it works**: It is a dedicated server (often a Docker node) that **you** host. 
- **The Workflow**: Fireblocks sends every transaction to your CRE via a webhook. Your CRE runs custom JavaScript/TypeScript/Python logic to approve or reject the transaction automatically.
- **Why use it?**: For high-volume RWA minting where you want to automate compliance checks (e.g., checking a whitelist database before approving a mint).

### ❓ Are we running a node right now?
**No.** For this integration:
- We are using **Direct API** calls to initiate the transaction.
- We rely on your existing Fireblocks Workspace rules (TAP) for authorization.
- You only need to "run a node" if you decide to implement a CRE to automate your governance rules.

---

## 4. Why Discovery might "Fail"
If your Fireblocks status is `COMPLETED` but our script says `Address Discovery Failed`:
1.  **Index Lag**: Public RPC nodes (Ankr, Blast) take a few seconds to "see" the transaction after Fireblocks sends it.
2.  **Re-orgs**: In testnets like Sepolia, the block might be re-organized, causing the receipt to disappear temporarily.
3.  **RPC Limits**: We use multiple RPCs to avoid rate-limiting.
