// backend/src/services/ipfsService.ts

/**
 * IPFS Service for ScholaChain
 * Handles file storage and retrieval using IPFS (InterPlanetary File System)
 * Provides methods to upload certificate files and generate CIDs
 * Supports both Pinata cloud service and local development mode
 */

// Interface for IPFS upload response
export interface IPFSUploadResponse {
  success: boolean;
  cid: string;
  url: string;
  size: number;
}

// Interface for IPFS service status
export interface IPFSStatus {
  configured: boolean;
  provider: string;
  ready: boolean;
  message?: string;
}

/**
 * IPFS Service Class
 * Handles decentralized file storage operations for certificate documents
 */
export class IPFSService {
  private pinataJWT: string | null;
  private isConfigured: boolean = false;
  private serviceReady: boolean = true;

  /**
   * Constructor - Initializes IPFS service with environment configuration
   */
  constructor() {
    this.pinataJWT = process.env.PINATA_JWT || null;
    this.isConfigured = !!this.pinataJWT;

    if (this.isConfigured) {
      console.log('✅ IPFS Service configured with Pinata cloud storage');
    } else {
      console.log(
        '⚠️ IPFS Service running in local development mode (files not permanently pinned)',
      );
      console.log(
        '💡 To enable cloud storage, set PINATA_JWT in backend/.env file',
      );
    }
  }

  /**
   * Upload a file to IPFS
   * @param fileBuffer - File content as Buffer
   * @param filename - Original filename for metadata
   * @returns IPFSUploadResponse with CID and URL
   * @throws Error if upload fails
   */
  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<IPFSUploadResponse> {
    try {
      console.log(
        `📤 Starting IPFS upload for: ${filename} (${fileBuffer.length} bytes)`,
      );

      // Validate input parameters
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('File buffer is empty or invalid');
      }

      if (!filename || filename.trim().length === 0) {
        throw new Error('Filename is required');
      }

      // Choose upload method based on configuration
      if (this.isConfigured && this.pinataJWT) {
        return await this.uploadToPinata(fileBuffer, filename);
      } else {
        return await this.uploadToLocalNode(fileBuffer, filename);
      }
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      throw new Error(
        `IPFS upload failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Upload file to Pinata cloud service for persistent storage
   * @param fileBuffer - File content as Buffer
   * @param filename - Original filename
   * @returns IPFSUploadResponse with CID and gateway URL
   * @private
   */
  private async uploadToPinata(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<IPFSUploadResponse> {
    try {
      console.log(`☁️ Uploading to Pinata cloud: ${filename}`);

      // Create FormData for file upload
      const formData = new FormData();

      // CORRECTION: Convert Buffer to Uint8Array first, then to Blob for proper TypeScript compatibility
      const uint8Array = new Uint8Array(fileBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      formData.append('file', blob, filename);

      // Add Pinata metadata for better organization
      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
          application: 'ScholaChain',
          timestamp: new Date().toISOString(),
          issuer: 'ScholaChain Platform',
          documentType: 'certificate',
        },
      });
      formData.append('pinataMetadata', metadata);

      // Configure Pinata options
      const options = JSON.stringify({
        cidVersion: 0, // Use CID v0 for compatibility
        wrapWithDirectory: false,
      });
      formData.append('pinataOptions', options);

      console.log('🔄 Sending request to Pinata API...');

      // Make API request to Pinata
      const response = await fetch(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.pinataJWT}`,
            // Note: Let browser set Content-Type for FormData with boundary
          },
          body: formData,
        },
      );

      // Handle API response errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Pinata API error: ${response.status}`, errorText);

        if (response.status === 401) {
          throw new Error(
            'Invalid Pinata JWT token. Please check your PINATA_JWT environment variable.',
          );
        } else if (response.status === 402) {
          throw new Error(
            'Pinata account limit exceeded. Please check your Pinata plan.',
          );
        } else {
          throw new Error(
            `Pinata API error: ${response.status} ${response.statusText}`,
          );
        }
      }

      // Parse successful response
      const data = await response.json();
      console.log('✅ Pinata API response received:', {
        cid: data.IpfsHash,
        size: data.PinSize,
        timestamp: data.Timestamp,
      });

      // Validate response data
      if (!data.IpfsHash) {
        throw new Error('Pinata response missing IpfsHash (CID)');
      }

      if (typeof data.IpfsHash !== 'string') {
        throw new Error('Invalid CID format received from Pinata');
      }

      // Return standardized response
      return {
        success: true,
        cid: data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
        size: data.PinSize || fileBuffer.length,
      };
    } catch (error) {
      console.error('❌ Pinata upload failed:', error);
      throw error; // Re-throw for upstream handling
    }
  }

  /**
   * Upload file to local IPFS node (for development and testing)
   * @param fileBuffer - File content as Buffer
   * @param filename - Original filename
   * @returns IPFSUploadResponse with mock CID and local URL
   * @private
   */
  private async uploadToLocalNode(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<IPFSUploadResponse> {
    console.log('📁 Simulating local IPFS upload for development:', filename);

    // Generate realistic mock CID for development
    const mockCID = this.generateMockCID(fileBuffer);

    console.log(`✅ Local IPFS upload simulated - CID: ${mockCID}`);

    // Return mock response that mimics real IPFS behavior
    return {
      success: true,
      cid: mockCID,
      url: `https://ipfs.io/ipfs/${mockCID}`, // Public IPFS gateway URL
      size: fileBuffer.length,
    };
  }

  /**
   * Generate a realistic mock CID for development purposes
   * Uses SHA-256 hash to create CID-like identifier
   * @param buffer - File buffer to hash
   * @returns Mock CID string in Qm... format
   * @private
   */
  private generateMockCID(buffer: Buffer): string {
    const crypto = require('crypto');

    // Generate SHA-256 hash of file content
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Format as CID v0 (Qm prefix + base58 encoded hash)
    // This creates a realistic-looking IPFS CID
    return `Qm${hash.substring(0, 44)}`;
  }

  /**
   * Verify if a file exists in IPFS by its CID
   * @param cid - IPFS Content Identifier to verify
   * @returns boolean indicating if file exists and is accessible
   */
  async verifyFileExists(cid: string): Promise<boolean> {
    try {
      console.log(`🔍 Verifying IPFS file existence for CID: ${cid}`);

      if (!cid || cid.length < 10) {
        throw new Error('Invalid CID provided for verification');
      }

      if (this.isConfigured && this.pinataJWT) {
        // Check with Pinata API for cloud storage
        const response = await fetch(
          `https://api.pinata.cloud/data/pinList?hashContains=${cid}`,
          {
            headers: {
              Authorization: `Bearer ${this.pinataJWT}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const exists = data.count > 0;
          console.log(
            `✅ Pinata verification: ${
              exists ? 'File exists' : 'File not found'
            }`,
          );
          return exists;
        }
        return false;
      } else {
        // For local development, assume file exists if CID format is valid
        const isValidFormat = cid.startsWith('Qm') && cid.length === 46;
        console.log(
          `✅ Local verification: ${
            isValidFormat ? 'CID format valid' : 'Invalid CID format'
          }`,
        );
        return isValidFormat;
      }
    } catch (error) {
      console.error('❌ IPFS verification failed:', error);
      return false;
    }
  }

  /**
   * Retrieve file from IPFS by CID
   * @param cid - IPFS Content Identifier
   * @returns File buffer if found, null otherwise
   */
  async getFile(cid: string): Promise<Buffer | null> {
    try {
      console.log(`📥 Retrieving file from IPFS: ${cid}`);

      if (!cid) {
        throw new Error('CID is required for file retrieval');
      }

      // Determine gateway URL based on configuration
      let gatewayUrl: string;
      if (this.isConfigured && this.pinataJWT) {
        gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
      } else {
        gatewayUrl = `https://ipfs.io/ipfs/${cid}`; // Public gateway for local mode
      }

      console.log(`🔗 Using gateway: ${gatewayUrl}`);

      const response = await fetch(gatewayUrl);

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        console.log(
          `✅ File retrieved successfully: ${fileBuffer.length} bytes`,
        );
        return fileBuffer;
      } else {
        console.warn(`⚠️ File not found at gateway: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error('❌ IPFS file retrieval failed:', error);
      return null;
    }
  }

  /**
   * Get IPFS service configuration and status
   * @returns IPFSStatus object with service information
   */
  getStatus(): IPFSStatus {
    return {
      configured: this.isConfigured,
      provider: this.isConfigured ? 'Pinata Cloud' : 'Local Development',
      ready: this.serviceReady,
      message: this.isConfigured
        ? 'Cloud storage enabled with Pinata'
        : 'Local mode - files not permanently pinned',
    };
  }

  /**
   * Validate CID format
   * @param cid - IPFS Content Identifier to validate
   * @returns boolean indicating if CID format is valid
   */
  isValidCID(cid: string): boolean {
    // Basic CID validation (CID v0 starts with Qm, 46 characters)
    const cidRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    return cidRegex.test(cid);
  }

  /**
   * Get gateway URL for a CID
   * @param cid - IPFS Content Identifier
   * @returns Gateway URL string
   */
  getGatewayURL(cid: string): string {
    if (this.isConfigured && this.pinataJWT) {
      return `https://gateway.pinata.cloud/ipfs/${cid}`;
    } else {
      return `https://ipfs.io/ipfs/${cid}`;
    }
  }
}

// Export singleton instance for use throughout the application
export const ipfsService = new IPFSService();
