# ScholaChain

## Overview

ScholaChain is a decentralized certificate and diploma verification platform that uses Ethereum blockchain technology to provide tamper-proof, transparent, and instant verification of academic and professional certificates.

## Problem Solved

- 🔍 Certificate Fraud Prevention: Eliminates fake certificates through blockchain immutability
- ⚡ Instant Verification: Reduces verification time from days to seconds
- 🔒 Data Integrity: Ensures certificates cannot be altered after issuance
- 🌐 Global Accessibility: Provides decentralized verification without central authority

## ✨ Key Features

### For Educational Institutions

- 🏛️ Role-based Access Control: Ministry of Education as SUPER_ADMIN (for issuer roles assignment)
- 📜 Certificate Issuance: Authorized institutions can issue tamper-proof certificates
- 🔄 Revocation Management: Ability to revoke compromised certificates
- 📊 Transparent Audit Trail: Complete history of all certificate operations

### For Certificate Holders

- 🔍 Instant Verification: Verify certificate authenticity in seconds
- 📱 Easy Sharing: Share verifiable certificates with employers/universities
- 💼 Permanent Storage: Certificates stored permanently on blockchain and IPFS

### For Verifiers

- 🎯 Dual Verification: Certificate ID + Document Hash verification
- 🔗 Direct Blockchain Proof: Link to exact transaction on Etherscan
- 📄 Document Integrity: SHA256 hash comparison for tamper detection
- 🌐 No Registration Required: Public verification without accounts

## Quick start

The project is configured for deployment on the local blockchain node network with [Hardhat](https://hardhat.org/) and on the [Sepolia](https://support.metamask.io/fr/more-web3/learn/eth-on-testnets/#sepolia) test blockchain network. In this tutorial, we provide instructions for a real-world deployment on the Sepolia Ethereum test network with transaction recording on [Etherscan](https://sepolia.etherscan.io).

## Prerequisites

Before you begin, ensure you have:

- [Docker](https://www.docker.com/products/docker-desktop/) (installed and running)
- [MetaMask](https://metamask.io/) browser extension
- [Git](https://git-scm.com/install/)
- Testnet ETH (for Sepolia deployment). You can get some on [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia) or [Google Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

## 1. Clone & Setup

The first things you need to do are cloning this repository and setting up the project environment files

```sh
git clone https://github.com/Mongetro/scholachain.git
```

## 2. Blockchain (.env) configuration

Create a .env file in the blockchain-smart-contracts directory :

In the project root directory:

```sh
cd scholachain
```

```sh
cp ./blockchain-smart-contracts/.env.example ./blockchain-smart-contracts/.env
```

Once you have copied the .env file, configure all environment variables according to the instructions included in the file.

PS : ⚠️ NEVER commit real private keys in your .env to version control

## 3. Backend (.env) configuration

Always in the project root directory:

```sh
cp ./backend/.env.example ./backend/.env
```

Once you have copied the .env file, configure all environment variables according to the instructions included in the file.

PS : ⚠️ NEVER commit real private keys in your .env to version control

## 4. Deployment of smart contracts and launch of the decentralized application (backend + frontend) using the Sepolia network

In the project root directory:

- Launch all services:

```sh
make sepolia
```

Wait until all services are up and running. The decentralized application (dApp) will usually be available at [http://localhost:5173/](http://localhost:5173/).

Remember that in the browser, you must have the account whose private key you added to scholachain/blockchain-smart-contracts/.env. This account is registered as the Ministry of Education (SUPER_ADMIN) during deployment. You should have other accounts (with Sepolia ETH) which will be considered certificate issuing institutions.

- Stop all services:

```sh
make stop
```

## User Guide

## 1. Connect Wallet

- Open the application in your browser at [http://localhost:5173/](http://localhost:5173/)
- Connect your wallet (MetaMask)
- Ensure you're on the correct network (Sepolia ...)

## 2. Institution Management

- Make sure you log in with the correct account (Ministry of Education (SUPER_ADMIN))
- Navigate to "Admin"
- Clic the Add Institution butont and fill the Register New Institution form
- Send data and confirm the blockchain transaction via your wallet (metamask)

## 3. Issue Certificate

- Make sure you log in with the correct account (an account registered as an issuer)
- Navigate to "Issue Certificate"
- Fill in details and upload the PDF certificate/diploma file
- Send data and confirm the blockchain transaction via your wallet (metamask)

## 4. Verify Certificate/Diploma

- Navigate to " Verify Certificate"
- Enter the certificate ID and upload the certificate PDF file
- Verify the Certificate via Verify Certificate Authenticity button

## Troubleshooting

**Common Issues**

**_Metamask Connection Issues_**

- Ensure you're on the correct network
- Reset account in MetaMask (Settings > Advanced > Clear activity tab data)

**_Transaction Failures_**

- Check you have sufficient gas funds (Sepoli ETH)
- Verify tha the services are running and contracts are deployed

**ScholaChain : Built with ❤️ for transparency and authenticity of diplomas and certificates! 🎉**
