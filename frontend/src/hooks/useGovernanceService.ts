// frontend/src/hooks/useGovernanceService.ts

/**
 * Custom React Hook for Governance Service
 * Provides GovernanceService instance with Web3 dependencies
 * Ensures proper React hook usage patterns and dependency injection
 */

import { useWeb3 } from '../contexts/Web3Context';
import { GovernanceService } from '../services/governanceService';

/**
 * Custom hook that provides GovernanceService instance
 * Injects Web3 dependencies from context into the service
 *
 * @returns GovernanceService instance configured with current Web3 context
 *
 * @example
 * ```tsx
 * const governanceService = useGovernanceService();
 * const isMinistry = await governanceService.isMinistryOfEducation();
 * ```
 */
export const useGovernanceService = (): GovernanceService => {
  // Get Web3 context for blockchain operations
  const web3Context = useWeb3();

  /**
   * Create GovernanceService instance with current Web3 dependencies
   * This ensures the service always has the latest connection state
   */
  const governanceService = new GovernanceService({
    account: web3Context.account,
    signer: web3Context.signer,
    contractConfigs: web3Context.contractConfigs,
  });

  return governanceService;
};

export default useGovernanceService;
