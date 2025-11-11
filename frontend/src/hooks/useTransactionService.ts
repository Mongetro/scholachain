// frontend/src/hooks/useTransactionService.ts

/**
 * React Hook for Transaction Service
 * Provides TransactionService instance with Web3 dependencies
 */

import { useWeb3 } from '../contexts/Web3Context';
import { TransactionService } from '../services/transactionService';

/**
 * Custom hook that provides TransactionService instance
 * Injects Web3 dependencies from context into the service
 */
export const useTransactionService = (): TransactionService => {
  const web3Context = useWeb3();

  const transactionService = new TransactionService({
    account: web3Context.account,
    signer: web3Context.signer,
    contractConfigs: web3Context.contractConfigs,
  });

  return transactionService;
};

export default useTransactionService;
