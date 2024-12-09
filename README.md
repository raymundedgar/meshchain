# MESHCHAIN Network

**MeshChain** is a decentralized network designed to provide cost-effective and scalable computational power for AI workloads. It addresses the challenges of high costs and limited access to AI resources, enabling everyone to easily contribute to and benefit from the power of AI.

- [https://app.meshchain.ai/](https://app.meshchain.ai?ref=LPRV67MRTLO2)

---

## MeshChain Automation Scripts

This repository contains a set of automation scripts to accomplish the following tasks on the MeshChain network:
- User registration
- Email verification
- Claiming rewards
- Starting mining

---

## Features

- Support for multiple accounts.
- Register new accounts.
- Verify email using OTP.
- Automatically claim BNB faucet rewards.
- Initialize and link unique nodes.

---

## Requirements

1. **Node.js Version:**
   - Requires Node.js 16 or later.

2. **Dependency Installation:**
   - Install required dependencies using `npm install`.

3. **Email Requirements:**
   - Each account needs a new email address (for verification and reward claims).

4. **Account and Node Limits:**
   - Each account can only link one node. For large-scale mining, create multiple accounts.

---

## File Descriptions

1. **Auto-Generated Files:**
   - After registering accounts using the script, the system will generate the following files automatically:
     - **`token.txt`**: Stores account tokens, one account per line, in the format `access_token|refresh_token`.
     - **`unique_id.txt`**: Stores the unique node ID for each account, one per line.

2. **Manually Created Files (if accounts already exist):**
   - If you already have accounts, you can manually create the files:
     - **Example `token.txt`:**
       ```
       abc123def456|xyz789ghi012
       ```
     - **Example `unique_id.txt`:**
       ```
       unique_id_1
       ```

---

## Usage Instructions

### 1. Clone the Repository
Clone the code to your local machine:
```bash
git clone https://github.com/raymundedgar/meshchain.git
cd meshchain
```

### 2. Install Dependencies
Run the following command to install the required project dependencies:
```bash
npm install
```

### 3. Register Accounts (skip if manually created tokens.txt and unique_id.txt)
Run the following command to start the registration script and follow the prompts to complete account registration:
```bash
npm run register
```
Enter your name, email, and password. The script will automatically save tokens to token.txt and the unique IDs to unique_id.txt.

### 4. Start the Script
Run the following command to start the main script for reward claiming and mining tasks:

```bash
npm run start
```