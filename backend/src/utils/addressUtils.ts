// backend/src/utils/addressUtils.ts

/**
 * Address Utilities for ScholaChain
 * Provides Ethereum address validation and normalization
 * Ensures compatibility with Viem and blockchain operations
 */

/**
 * Check if a string is a valid Ethereum address
 * @param address - String to validate as Ethereum address
 * @returns boolean indicating if address is valid
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Normalize an Ethereum address to ensure 0x prefix and proper casing
 * @param address - Address string to normalize
 * @returns Normalized address or null if invalid
 */
export function normalizeAddress(address: string): `0x${string}` | null {
  if (!isValidEthereumAddress(address)) {
    return null;
  }

  // Ensure the address starts with 0x and has exactly 40 hex characters
  const cleanAddress = address.startsWith('0x') ? address : `0x${address}`;

  if (cleanAddress.length !== 42) {
    return null;
  }

  return cleanAddress.toLowerCase() as `0x${string}`;
}

/**
 * Validate and normalize an address, throwing an error if invalid
 * @param address - Address string to validate and normalize
 * @returns Normalized address as `0x${string}`
 * @throws Error if address is invalid
 */
export function validateAndNormalizeAddress(address: string): `0x${string}` {
  const normalized = normalizeAddress(address);

  if (!normalized) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }

  return normalized;
}

/**
 * Check if two addresses are equal (case-insensitive)
 * @param address1 - First address to compare
 * @param address2 - Second address to compare
 * @returns boolean indicating if addresses are equal
 */
export function areAddressesEqual(address1: string, address2: string): boolean {
  const normalized1 = normalizeAddress(address1);
  const normalized2 = normalizeAddress(address2);

  if (!normalized1 || !normalized2) {
    return false;
  }

  return normalized1.toLowerCase() === normalized2.toLowerCase();
}
