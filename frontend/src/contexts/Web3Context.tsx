// frontend/src/contexts/Web3Context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// Types for Web3 connection only
interface ContractConfig {
  address: string;
  abi: any[];
  contractName: string;
  network: string;
  chainId: number;
  deployedAt: string;
}

interface NetworkConfig {
  network: string;
  chainId: number;
  ministryOfEducation: string;
  deployedAt: string;
  version: string;
}

interface Web3State {
  account: string | null;
  provider: any;
  signer: any;
  network: any;
  contractConfigs: {
    governance?: ContractConfig;
    scholachain?: ContractConfig;
    network?: NetworkConfig;
  };
  loading: boolean;
  error: string | null;
}

interface Web3ContextType extends Web3State {
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

/**
 * Web3Provider - Manages ONLY blockchain connection and contract configuration
 * Single Responsibility: Handle wallet connection and contract instances
 */
export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<Web3State>({
    account: null,
    provider: null,
    signer: null,
    network: null,
    contractConfigs: {},
    loading: true, // Start with loading true
    error: null,
  });

  /**
   * Wait for contract files to be available with timeout
   */
  const waitForContractFiles = async (timeoutMs = 30000): Promise<boolean> => {
    const startTime = Date.now();
    console.log('⏳ Waiting for contract files to be available...');

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch('/contract-data/network.json', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        if (response.ok) {
          console.log('✅ Contract files are available');
          return true;
        }
      } catch (error) {
        // Files not available yet, continue waiting
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('❌ Timeout waiting for contract files');
    return false;
  };

  /**
   * Load contract configuration from deployed files with better error handling
   */
  const loadContractConfig = async (
    contractName: string,
  ): Promise<ContractConfig> => {
    try {
      console.log(
        `📁 Loading contract configuration: /contract-data/${contractName}.json`,
      );
      const response = await fetch(`/contract-data/${contractName}.json`, {
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 100)}...`);
      }

      const config = await response.json();

      // Validate contract configuration
      if (!config.address) {
        throw new Error(`Contract configuration missing address field`);
      }

      if (!config.abi || !Array.isArray(config.abi)) {
        throw new Error(`Contract configuration missing or invalid ABI`);
      }

      console.log(`✅ Loaded ${contractName}: ${config.address}`);
      return config;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`❌ Failed to load ${contractName}:`, errorMessage);
      throw new Error(`Failed to load ${contractName}.json: ${errorMessage}`);
    }
  };

  /**
   * Load network configuration with better error handling
   */
  const loadNetworkConfig = async (): Promise<NetworkConfig> => {
    try {
      console.log(
        '📁 Loading network configuration: /contract-data/network.json',
      );
      const response = await fetch('/contract-data/network.json', {
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 100)}...`);
      }

      const config = await response.json();

      // Validate network configuration
      if (!config.network) {
        throw new Error('Network configuration missing network field');
      }

      if (!config.chainId) {
        throw new Error('Network configuration missing chainId field');
      }

      console.log('✅ Loaded network configuration:', config.network);
      return config;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Failed to load network config:', errorMessage);
      throw new Error(`Failed to load network.json: ${errorMessage}`);
    }
  };

  /**
   * Check if contract files exist before trying to load them
   */
  const checkContractFilesExist = async (): Promise<boolean> => {
    try {
      const filesToCheck = [
        '/contract-data/ScholaChainGovernance.json',
        '/contract-data/ScholaChain.json',
        '/contract-data/network.json',
      ];

      for (const file of filesToCheck) {
        const response = await fetch(file, {
          method: 'HEAD',
          cache: 'no-cache',
        });
        if (!response.ok) {
          console.error(`❌ Contract file not found: ${file}`);
          return false;
        }
      }

      console.log('✅ All contract files exist');
      return true;
    } catch (error) {
      console.error('❌ Error checking contract files:', error);
      return false;
    }
  };

  /**
   * Initialize Web3 connection and load contract configurations
   */
  const initWeb3 = async () => {
    try {
      console.log('🚀 Initializing Web3 connection...');

      // Check for Ethereum provider
      if (typeof window === 'undefined') {
        throw new Error('Window object not available (server-side rendering)');
      }

      if (!window.ethereum) {
        throw new Error(
          'MetaMask not detected. Please install MetaMask to continue.',
        );
      }

      // Show loading state
      setState((prev) => ({
        ...prev,
        loading: true,
        error: 'Checking contract deployment...',
      }));

      // Wait for contract files to be available
      console.log('⏳ Waiting for contract files...');
      setState((prev) => ({
        ...prev,
        error: 'Waiting for contract deployment...',
      }));

      const filesAvailable = await waitForContractFiles();
      if (!filesAvailable) {
        throw new Error(
          'Contract files not ready. Please wait for deployment to complete or run: make deploy-sepolia',
        );
      }

      // First, check if contract files exist
      const filesExist = await checkContractFilesExist();
      if (!filesExist) {
        throw new Error(
          'Contract files not found. Please deploy contracts first using: make deploy-sepolia',
        );
      }

      console.log('🔗 Loading contract configurations...');
      setState((prev) => ({
        ...prev,
        error: 'Loading contract configurations...',
      }));

      // Load ALL configurations first
      const [governanceConfig, scholachainConfig, networkConfig] =
        await Promise.all([
          loadContractConfig('ScholaChainGovernance'),
          loadContractConfig('ScholaChain'),
          loadNetworkConfig(),
        ]);

      console.log('✅ All configurations loaded successfully');
      setState((prev) => ({ ...prev, error: 'Connecting to MetaMask...' }));

      const { BrowserProvider } = await import('ethers');
      const provider = new BrowserProvider(window.ethereum);

      // Check if provider is working
      const network = await provider.getNetwork();
      console.log(
        `🌐 Connected to network: ${network.name} (Chain ID: ${network.chainId})`,
      );

      // Verify we're on the correct network
      if (network.chainId !== BigInt(networkConfig.chainId)) {
        const expectedNetwork = `${networkConfig.network} (Chain ID: ${networkConfig.chainId})`;
        const currentNetwork = `${network.name} (Chain ID: ${network.chainId})`;
        throw new Error(
          `Wrong network. Please switch to ${expectedNetwork}. Currently on ${currentNetwork}`,
        );
      }

      // Request account access
      console.log('🔐 Requesting account access...');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      console.log(`✅ Connected with account: ${account}`);

      // Update state with successful connection
      setState({
        account,
        provider,
        signer,
        network,
        contractConfigs: {
          governance: governanceConfig,
          scholachain: scholachainConfig,
          network: networkConfig,
        },
        loading: false,
        error: null,
      });

      console.log('🎉 Web3 connection established successfully');
      //toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('💥 Web3 initialization failed:', error);

      let userMessage = 'Failed to connect to blockchain';

      if (
        error.message.includes('Contract files not ready') ||
        error.message.includes('Contract files not found')
      ) {
        userMessage =
          'Contracts not deployed yet. Please run: make deploy-sepolia';
      } else if (error.message.includes('Failed to load')) {
        userMessage =
          'Contract configuration error. Please redeploy contracts.';
      } else if (error.code === 4001) {
        userMessage =
          'Connection cancelled. Please approve the connection in MetaMask.';
      } else if (error.message.includes('MetaMask not detected')) {
        userMessage = 'MetaMask not found. Please install MetaMask extension.';
      } else if (error.message.includes('Wrong network')) {
        userMessage = error.message;
      } else if (error.message.includes('No accounts found')) {
        userMessage = 'No accounts found. Please unlock MetaMask.';
      } else if (error.message.includes('user rejected')) {
        userMessage =
          'Connection rejected. Please approve the connection in MetaMask.';
      } else {
        userMessage = `Connection failed: ${error.message}`;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: userMessage,
      }));

      console.error('💥 Web3 connection error:', userMessage);

      // Only show toast for user-actionable errors, not for initial loading
      if (!error.message.includes('Contract files not ready')) {
        toast.error(userMessage);
      }
    }
  };

  /**
   * Connect wallet - user initiated connection
   */
  const connect = async () => {
    console.log('🔄 Manual connection requested');
    await initWeb3();
  };

  /**
   * Disconnect wallet
   */
  const disconnect = () => {
    console.log('🔌 Disconnecting wallet');
    setState({
      account: null,
      provider: null,
      signer: null,
      network: null,
      contractConfigs: {},
      loading: false,
      error: 'Please connect your wallet to access blockchain features',
    });
    toast.success('Wallet disconnected');
  };

  /**
   * Reconnect
   */
  const reconnect = async () => {
    console.log('🔄 Reconnecting wallet');
    await initWeb3();
  };

  // Event handlers
  const handleAccountsChanged = (accounts: string[]) => {
    console.log('🔄 Accounts changed:', accounts);
    if (accounts.length === 0) {
      disconnect();
    } else {
      setState((prev) => ({
        ...prev,
        account: accounts[0] || null,
        error: null,
      }));
      // Use toast.success instead of toast.info which doesn't exist
      toast.success('Wallet account changed');
    }
  };

  const handleChainChanged = (chainId: string) => {
    console.log('🔄 Chain changed:', chainId);
    // Use toast.success instead of toast.info
    toast.success('Network changed, reloading...');
    window.location.reload();
  };

  // Set up event listeners and initialize connection
  useEffect(() => {
    console.log('🔧 Setting up Web3 provider...');

    if (typeof window === 'undefined') {
      console.log('⚠️  Window not available (server-side)');
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    if (!window.ethereum) {
      console.log('❌ MetaMask not detected');
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'MetaMask not detected. Please install the MetaMask extension.',
      }));
      return;
    }

    console.log('✅ MetaMask detected, initializing connection...');

    // Initialize connection
    initWeb3();

    // Set up event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Clean up event listeners
    return () => {
      console.log('🧹 Cleaning up Web3 event listeners');
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const contextValue: Web3ContextType = {
    ...state,
    connect,
    disconnect,
    reconnect,
  };

  return (
    <Web3Context.Provider value={contextValue}>{children}</Web3Context.Provider>
  );
};

/**
 * Hook to use Web3 context
 */
export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
