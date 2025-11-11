// blockchain-smart-contracts/ignition/modules/ScholaChain.ts

/**
 * ScholaChain Deployment Module
 * Deploys Governance and Main contracts, registers Ministry of Education as SUPER_ADMIN
 */

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('ScholaChainModule', (m) => {
  // Use account #0 from Hardhat as the ministry/super admin
  // This will be the deployer account (TESTNET_PRIVATE_KEY holder on Sepolia)
  const ministryOfEducation = m.getAccount(0);

  // Deploy the Governance contract with Ministry as initial admin
  const scholachainGovernance = m.contract('ScholaChainGovernance', [
    ministryOfEducation,
  ]);

  // Deploy the main ScholaChain contract with governance address
  const scholachain = m.contract('ScholaChain', [scholachainGovernance]);

  return { scholachainGovernance, scholachain };
});
