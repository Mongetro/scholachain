/**
 * Hash Service for ScholaChain
 * Provides cryptographic hash functions for document verification
 * Ensures data integrity and tamper-proof certificate storage
 */

import { createHash } from 'crypto';

/**
 * Hash service class for cryptographic operations
 */
export class HashService {
  /**
   * Generate SHA-256 hash from file buffer
   * @param fileBuffer - File content as Buffer
   * @returns SHA-256 hash as hexadecimal string with 0x prefix
   */
  generateSHA256Hash(fileBuffer: Buffer): string {
    const hash = createHash('sha256');
    hash.update(fileBuffer);
    const digest = hash.digest('hex');

    // Return with 0x prefix for blockchain compatibility
    return `0x${digest}`;
  }

  /**
   * Generate SHA-256 hash from string data
   * @param data - String data to hash
   * @returns SHA-256 hash as hexadecimal string with 0x prefix
   */
  generateSHA256HashFromString(data: string): string {
    const hash = createHash('sha256');
    hash.update(data, 'utf8');
    const digest = hash.digest('hex');

    return `0x${digest}`;
  }

  /**
   * Validate if a string is a valid SHA-256 hash
   * @param hash - Hash string to validate
   * @returns boolean indicating if hash format is valid
   */
  isValidSHA256Hash(hash: string): boolean {
    // SHA-256 hash should be 64 hex characters + optional 0x prefix
    const sha256Regex = /^(0x)?[a-fA-F0-9]{64}$/;
    return sha256Regex.test(hash);
  }

  /**
   * Normalize hash format to include 0x prefix
   * @param hash - Hash string to normalize
   * @returns Normalized hash with 0x prefix
   */
  normalizeHash(hash: string): string {
    if (hash.startsWith('0x')) {
      return hash;
    }
    return `0x${hash}`;
  }

  /**
   * Compare two hashes for equality
   * @param hash1 - First hash to compare
   * @param hash2 - Second hash to compare
   * @returns boolean indicating if hashes are equal
   */
  compareHashes(hash1: string, hash2: string): boolean {
    const normalized1 = this.normalizeHash(hash1);
    const normalized2 = this.normalizeHash(hash2);
    return normalized1 === normalized2;
  }

  /**
   * Generate hash from multiple data fields (for composite data)
   * @param fields - Array of string fields to hash together
   * @returns Combined SHA-256 hash
   */
  generateCompositeHash(fields: string[]): string {
    const combinedData = fields.join('|');
    return this.generateSHA256HashFromString(combinedData);
  }
}

// Export singleton instance
export const hashService = new HashService();
