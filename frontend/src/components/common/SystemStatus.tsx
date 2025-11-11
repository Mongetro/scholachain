// frontend/src/components/common/SystemStatus.tsx

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Badge, Card, Spinner } from 'react-bootstrap';
import { apiService } from '../../services/api';

/**
 * System Status Component showing blockchain and backend status
 */
const SystemStatus: React.FC = () => {
  const { data: blockchainStatus, isLoading } = useQuery({
    queryKey: ['blockchain-status'],
    queryFn: () => apiService.getBlockchainStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className="certichain-card">
      <Card.Header className="bg-transparent border-0 pb-0">
        <h6 className="mb-0">
          <i className="bi bi-activity me-2"></i>
          System Status
        </h6>
      </Card.Header>

      <Card.Body>
        {isLoading ? (
          <div className="text-center">
            <Spinner animation="border" size="sm" className="me-2" />
            Checking status...
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            <div className="d-flex justify-content-between align-items-center">
              <span>Blockchain:</span>
              <Badge
                className={
                  blockchainStatus?.blockchain.status === 'connected'
                    ? 'status-connected'
                    : 'status-disconnected'
                }
              >
                {blockchainStatus?.blockchain.status === 'connected' ? (
                  <>
                    <i className="bi bi-check-circle me-1"></i>Connected
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-circle me-1"></i>Disconnected
                  </>
                )}
              </Badge>
            </div>

            {blockchainStatus?.blockchain.latestBlock && (
              <div className="d-flex justify-content-between align-items-center">
                <span>Latest Block:</span>
                <Badge bg="light" text="dark">
                  #{blockchainStatus.blockchain.latestBlock.toLocaleString()}
                </Badge>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center">
              <span>Network:</span>
              <Badge bg="primary">Sepolia</Badge>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default SystemStatus;
