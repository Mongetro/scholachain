// frontend/src/hooks/useCertificateService.ts

/**
 * Custom React Hook for Certificate Service
 * Provides CertificateService instance with Web3 dependencies
 */

import { useMemo } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { CertificateService } from '../services/certificateService';

/**
 * Custom hook that provides CertificateService instance
 * Injects Web3 dependencies from context into the service
 */
export const useCertificateService = (): CertificateService => {
  const web3Context = useWeb3();

  const certificateService = useMemo(() => {
    console.log(
      '🔄 [useCertificateService] Creating new CertificateService instance',
      {
        account: web3Context.account
          ? `${web3Context.account.slice(0, 10)}...`
          : 'null',
        signer: !!web3Context.signer,
        contractConfigs: {
          scholachain: !!web3Context.contractConfigs.scholachain,
          governance: !!web3Context.contractConfigs.governance,
        },
      },
    );

    return new CertificateService({
      account: web3Context.account,
      signer: web3Context.signer,
      contractConfigs: web3Context.contractConfigs,
    });
  }, [web3Context.account, web3Context.signer, web3Context.contractConfigs]);

  return certificateService;
};

export default useCertificateService;
