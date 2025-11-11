/**
 * API service for ScholaChain frontend
 * Handles all HTTP requests to the backend
 */

import {
  ApiResponse,
  BlockchainStatus,
  Certificate,
  VerificationRequest,
  VerificationResult,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

class ApiService {
  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.fetchApi('/health');
  }

  // Blockchain status
  async getBlockchainStatus(): Promise<{ blockchain: BlockchainStatus }> {
    return this.fetchApi('/api/blockchain/status');
  }

  // Certificate operations
  async getCertificate(certificateId: number): Promise<Certificate> {
    return this.fetchApi(`/api/certificates/${certificateId}`);
  }

  async verifyCertificate(
    request: VerificationRequest,
  ): Promise<VerificationResult> {
    return this.fetchApi('/api/certificates/verify', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getTotalCertificates(): Promise<{ totalCertificates: number }> {
    return this.fetchApi('/api/blockchain/certificates/total');
  }

  // IPFS operations
  async getIPFSStatus(): Promise<{ configured: boolean; provider: string }> {
    return this.fetchApi('/api/ipfs/status');
  }
}

export const apiService = new ApiService();
