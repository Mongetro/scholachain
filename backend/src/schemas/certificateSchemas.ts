// backend/src/schemas/certificateSchemas.ts
import { z } from 'zod';

/**
 * Certificate issuance validation schema
 * Validates the request body for issuing a new certificate
 */
export const issueCertificateSchema = z.object({
  documentHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, {
    message:
      'Document hash must be a 64-character hexadecimal string starting with 0x',
  }),
  ipfsCID: z
    .string()
    .min(1, { message: 'IPFS CID is required' })
    .max(100, { message: 'IPFS CID is too long' }),
  holderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Holder address must be a valid Ethereum address',
  }),
  issuerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Issuer address must be a valid Ethereum address',
  }),
  certificateType: z.string().optional(),
});

/**
 * Certificate preparation validation schema
 * Validates the request body for preparing certificate issuance
 */
export const prepareCertificateSchema = z.object({
  documentHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, {
    message:
      'Document hash must be a 64-character hexadecimal string starting with 0x',
  }),
  ipfsCID: z
    .string()
    .min(1, { message: 'IPFS CID is required' })
    .max(100, { message: 'IPFS CID is too long' }),
  holderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Holder address must be a valid Ethereum address',
  }),
  issuerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Issuer address must be a valid Ethereum address',
  }),
  certificateType: z.string().optional(),
});

/**
 * Certificate verification validation schema
 * Validates the request body for verifying a certificate
 */
export const verifyCertificateSchema = z.object({
  certificateId: z
    .number()
    .int({ message: 'Certificate ID must be an integer' })
    .positive({ message: 'Certificate ID must be positive' }),
  documentHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, {
    message:
      'Document hash must be a 64-character hexadecimal string starting with 0x',
  }),
});

/**
 * Certificate lookup validation schema
 * Validates the certificate ID parameter for GET requests
 */
export const certificateIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, { message: 'Certificate ID must be a numeric string' })
    .transform(Number)
    .refine((n) => n > 0, { message: 'Certificate ID must be positive' }),
});

/**
 * Ethereum address validation schema
 * Validates Ethereum addresses for various endpoints
 */
export const addressSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Must be a valid Ethereum address',
  }),
});

// Export types for TypeScript inference
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
export type PrepareCertificateInput = z.infer<typeof prepareCertificateSchema>;
export type VerifyCertificateInput = z.infer<typeof verifyCertificateSchema>;
export type CertificateIdInput = z.infer<typeof certificateIdSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
