// frontend/src/hooks/useCertificates.ts

/**
 * Custom React Hook for certificate management
 * Provides certificate listing and management functionality
 * Uses useCertificateService internally for blockchain operations
 * Enhanced with error handling, loading states, and real-time updates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useWeb3 } from '../contexts/Web3Context';
import { useCertificateService } from './useCertificateService';

// ==================== TYPE DEFINITIONS ====================

export interface CertificateStats {
  total: number;
  active: number;
  revoked: number;
  issuedByUser: number;
}

export interface UseCertificatesReturn {
  // Issuer-specific certificates
  certificates: any[];
  isLoadingCertificates: boolean;
  isErrorCertificates: boolean;
  certificatesError: Error | null;

  // All certificates (for verification and admin purposes)
  allCertificates: any[];
  isLoadingAllCertificates: boolean;
  isErrorAllCertificates: boolean;
  allCertificatesError: Error | null;

  // Certificate count
  certificateCount: number;
  isLoadingCount: boolean;
  countError: Error | null;

  // Statistics
  stats: CertificateStats;

  // Certificate operations
  getCertificate: (id: number) => Promise<any | null>;
  verifyCertificate: (id: number, documentHash: string) => Promise<boolean>;
  revokeCertificate: (
    id: number,
  ) => Promise<{ success: boolean; error?: string }>;
  issueCertificate: (data: any) => Promise<any>;

  // Refetch functions
  refetchCertificates: () => Promise<any>;
  refetchAllCertificates: () => Promise<any>;
  refetchCertificateCount: () => Promise<any>;

  // Status information
  isServiceReady: boolean;
  hasCertificates: boolean;
  hasAllCertificates: boolean;

  // Mutation states
  isIssuingCertificate: boolean;
  isRevokingCertificate: boolean;
}

/**
 * Hook for managing certificates with automatic refresh and event handling
 * Provides comprehensive certificate management functionality
 */
export const useCertificates = (): UseCertificatesReturn => {
  const { account } = useWeb3();
  const certificateService = useCertificateService();
  const queryClient = useQueryClient();

  // ==================== QUERY DEFINITIONS ====================

  /**
   * Query for fetching certificates by current issuer
   * Automatically refetches when account changes or new certificates are issued
   */
  const certificatesQuery = useQuery({
    queryKey: ['certificates', 'issuer', account],
    queryFn: async () => {
      if (!account) {
        console.log(
          '❌ No account connected, returning empty certificate list',
        );
        return [];
      }

      console.log(
        `🔍 [useCertificates] Fetching certificates for issuer: ${account}`,
      );

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<[]>((_, reject) =>
        setTimeout(
          () => reject(new Error('Timeout fetching certificates')),
          30000,
        ),
      );

      const certificatesPromise =
        certificateService.getCertificatesByIssuer(account);
      const certificates = await Promise.race([
        certificatesPromise,
        timeoutPromise,
      ]);

      console.log(
        `✅ [useCertificates] Retrieved ${certificates.length} certificates for issuer ${account}`,
      );
      return certificates;
    },
    enabled: !!account && certificateService.isServiceReady(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2, // Retry twice on failure
    refetchOnWindowFocus: true,
  });

  /**
   * Query for fetching all certificates (for verification and admin purposes)
   * Less frequent updates as this is used for public verification
   */
  const allCertificatesQuery = useQuery({
    queryKey: ['certificates', 'all'],
    queryFn: async () => {
      console.log(
        '🔍 [useCertificates] Fetching ALL certificates from blockchain...',
      );

      const timeoutPromise = new Promise<[]>((_, reject) =>
        setTimeout(
          () => reject(new Error('Timeout fetching all certificates')),
          45000,
        ),
      );

      const certificatesPromise = certificateService.getAllCertificates();
      const certificates = await Promise.race([
        certificatesPromise,
        timeoutPromise,
      ]);

      console.log(
        `✅ [useCertificates] Retrieved ${certificates.length} total certificates`,
      );
      return certificates;
    },
    enabled: certificateService.isServiceReady(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  /**
   * Query for certificate count
   * Lightweight query for quick status updates
   */
  const certificateCountQuery = useQuery({
    queryKey: ['certificates', 'count'],
    queryFn: async () => {
      console.log('🔍 [useCertificates] Fetching certificate count...');

      const timeoutPromise = new Promise<number>((_, reject) =>
        setTimeout(
          () => reject(new Error('Timeout fetching certificate count')),
          15000,
        ),
      );

      const countPromise = certificateService.getCertificateCount();
      const count = await Promise.race([countPromise, timeoutPromise]);

      console.log(`✅ [useCertificates] Certificate count: ${count}`);
      return count;
    },
    enabled: certificateService.isServiceReady(),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 3,
  });

  // ==================== MUTATION DEFINITIONS ====================

  /**
   * Mutation for issuing new certificates
   * Handles the complete issuance workflow with optimistic updates
   */
  const issueCertificateMutation = useMutation({
    mutationFn: async (certificateData: any) => {
      console.log('🎯 [useCertificates] Issuing new certificate...');
      return await certificateService.issueCertificateReal(certificateData);
    },
    onSuccess: (result) => {
      if (result.success) {
        console.log('✅ [useCertificates] Certificate issued successfully');

        // Invalidate and refetch all certificate-related queries
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
        queryClient.invalidateQueries({ queryKey: ['certificates-all'] });
        queryClient.invalidateQueries({ queryKey: ['certificates-count'] });

        // Dispatch global event for other components
        window.dispatchEvent(
          new CustomEvent('certificate-issued', {
            detail: {
              certificateId: result.certificateId,
              transactionHash: result.transactionHash,
              holderAddress: result.documentHash, // This would need to be adjusted based on actual data structure
            },
          }),
        );

        toast.success(
          `Certificate #${result.certificateId} issued successfully!`,
        );
      } else {
        throw new Error(result.error || 'Certificate issuance failed');
      }
    },
    onError: (error: Error) => {
      console.error('❌ [useCertificates] Certificate issuance failed:', error);
      toast.error(`Certificate issuance failed: ${error.message}`);
    },
  });

  /**
   * Mutation for revoking certificates
   * Provides immediate UI feedback with optimistic updates
   */
  const revokeCertificateMutation = useMutation({
    mutationFn: async (certificateId: number) => {
      console.log(
        `🔄 [useCertificates] Revoking certificate #${certificateId}...`,
      );
      return await certificateService.revokeCertificate(certificateId);
    },
    onSuccess: (result, certificateId) => {
      if (result.success) {
        console.log(
          `✅ [useCertificates] Certificate #${certificateId} revoked successfully`,
        );

        // Invalidate and refetch certificate queries
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
        queryClient.invalidateQueries({ queryKey: ['certificates-all'] });

        toast.success(`Certificate #${certificateId} revoked successfully`);
      } else {
        throw new Error(result.error || 'Certificate revocation failed');
      }
    },
    onError: (error: Error, certificateId) => {
      console.error(
        `❌ [useCertificates] Certificate #${certificateId} revocation failed:`,
        error,
      );
      toast.error(`Revocation failed: ${error.message}`);
    },
  });

  // ==================== STATISTICS CALCULATION ====================

  /**
   * Calculate comprehensive certificate statistics
   * Memoized to prevent unnecessary recalculations
   */
  const stats = useMemo((): CertificateStats => {
    const userCertificates = certificatesQuery.data || [];
    const allCerts = allCertificatesQuery.data || [];

    return {
      total: allCerts.length,
      active: allCerts.filter((cert) => !cert.revoked).length,
      revoked: allCerts.filter((cert) => cert.revoked).length,
      issuedByUser: userCertificates.length,
    };
  }, [certificatesQuery.data, allCertificatesQuery.data]);

  // ==================== EVENT LISTENERS ====================

  /**
   * Listen for certificate issuance events to trigger refetch
   * Ensures real-time updates across the application
   */
  useEffect(() => {
    const handleCertificateIssued = (event: CustomEvent) => {
      console.log(
        '🔄 [useCertificates] Certificate issued event received, refetching queries...',
      );

      // Refetch all certificate-related queries
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['certificates-all'] });
      queryClient.invalidateQueries({ queryKey: ['certificates-count'] });

      // Log success details if available
      if (event.detail) {
        console.log('🎉 New certificate details:', event.detail);
      }
    };

    // Add event listener for custom certificate-issued event
    window.addEventListener(
      'certificate-issued',
      handleCertificateIssued as EventListener,
    );

    return () => {
      window.removeEventListener(
        'certificate-issued',
        handleCertificateIssued as EventListener,
      );
    };
  }, [queryClient]);

  /**
   * Listen for account changes to refetch issuer-specific certificates
   * Ensures user sees their certificates when switching accounts
   */
  useEffect(() => {
    if (account) {
      console.log(
        `🔄 [useCertificates] Account changed to ${account}, refetching issuer certificates`,
      );
      certificatesQuery.refetch();
    }
  }, [account, certificatesQuery]);

  /**
   * Listen for network changes to refresh all certificate data
   * Important when switching between different blockchain networks
   */
  useEffect(() => {
    if (certificateService.isServiceReady()) {
      console.log(
        '🔄 [useCertificates] Service ready, refetching certificate data',
      );
      // Small delay to ensure contract configurations are loaded
      setTimeout(() => {
        certificatesQuery.refetch();
        allCertificatesQuery.refetch();
        certificateCountQuery.refetch();
      }, 1000);
    }
  }, [certificateService.isServiceReady()]);

  // ==================== RETURN OBJECT ====================

  return {
    // Issuer-specific certificates
    certificates: certificatesQuery.data || [],
    isLoadingCertificates: certificatesQuery.isLoading,
    isErrorCertificates: certificatesQuery.isError,
    certificatesError: certificatesQuery.error,

    // All certificates (for verification and admin)
    allCertificates: allCertificatesQuery.data || [],
    isLoadingAllCertificates: allCertificatesQuery.isLoading,
    isErrorAllCertificates: allCertificatesQuery.isError,
    allCertificatesError: allCertificatesQuery.error,

    // Certificate count
    certificateCount: certificateCountQuery.data || 0,
    isLoadingCount: certificateCountQuery.isLoading,
    countError: certificateCountQuery.error,

    // Statistics
    stats,

    // Certificate operations
    getCertificate: certificateService.getCertificate.bind(certificateService),
    verifyCertificate:
      certificateService.verifyCertificate.bind(certificateService),
    revokeCertificate: revokeCertificateMutation.mutateAsync,
    issueCertificate: issueCertificateMutation.mutateAsync,

    // Refetch functions
    refetchCertificates: certificatesQuery.refetch,
    refetchAllCertificates: allCertificatesQuery.refetch,
    refetchCertificateCount: certificateCountQuery.refetch,

    // Status information
    isServiceReady: certificateService.isServiceReady(),
    hasCertificates: (certificatesQuery.data?.length || 0) > 0,
    hasAllCertificates: (allCertificatesQuery.data?.length || 0) > 0,

    // Mutation states
    isIssuingCertificate: issueCertificateMutation.isPending,
    isRevokingCertificate: revokeCertificateMutation.isPending,
  };
};

export default useCertificates;
