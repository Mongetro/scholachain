/**
 * Type definitions for ScholaChain frontend
 */

export interface Certificate {
  id: number;
  documentHash: string;
  ipfsCID: string;
  issuer: string;
  holder: string;
  issuedAt: Date;
  revoked: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface BlockchainStatus {
  status: 'connected' | 'disconnected';
  latestBlock?: number;
  error?: string;
}

export interface VerificationRequest {
  certificateId: number;
  documentHash: string;
}

export interface VerificationResult {
  certificateId: number;
  documentHash: string;
  valid: boolean;
  timestamp: string;
  verifiedOn: string;
}
