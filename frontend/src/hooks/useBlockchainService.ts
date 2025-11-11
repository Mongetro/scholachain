import { useWeb3 } from '../contexts/Web3Context';

/**

* Custom hook for blockchain services

* Provides the necessary dependencies for the services

*/
export const useBlockchainService = () => {
  const web3Context = useWeb3();

  return {
    account: web3Context.account,

    signer: web3Context.signer,

    contractConfigs: web3Context.contractConfigs,

    isConnected: !!web3Context.account && !!web3Context.signer,
  };
};
