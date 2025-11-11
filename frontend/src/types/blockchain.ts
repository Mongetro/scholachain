// frontend/src/types/blockchain.ts

//Define the TypeScript data structures

export interface InstitutionRegistrationData {
  address: string;
  name: string;
  description: string;
  website: string;
  role: 'ISSUER' | 'SUPER_ADMIN';
}

export interface BlockchainInstitutionData {
  address: string;
  name: string;
  description: string;
  website: string;
  isActive: boolean;
  registeredAt: number;
  role: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isSupportedChain: boolean;
}
