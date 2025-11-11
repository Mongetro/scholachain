// frontend/src/components/common/WalletAccount.tsx
import React from 'react';
import { Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useWeb3 } from '../../contexts/Web3Context';

/**
 * MetaMask Account Component using Web3 Context
 * Displays connected wallet address and handles connection state
 */
const MetaMaskAccount: React.FC = () => {
  const { account, loading, error, connect } = useWeb3();

  const [copied, setCopied] = React.useState(false);

  /**
   * Format Ethereum address for display
   * Shows first 6 and last 4 characters for readability
   */
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Copy address to clipboard
   */
  const copyToClipboard = async (address: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Loading state - show connecting indicator
  if (loading) {
    return (
      <div className="d-flex align-items-center text-muted small">
        <i className="bi bi-arrow-repeat spinner-border spinner-border-sm me-2"></i>
        Connecting...
      </div>
    );
  }

  // Error state - show error message and retry button
  if (error && !account) {
    return (
      <div className="d-flex align-items-center">
        <Button
          variant="outline-warning"
          size="sm"
          onClick={connect}
          disabled={loading}
          className="connect-wallet-btn"
          title={error}
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          Retry Connection
        </Button>
        <div className="text-warning small ms-2" title={error}>
          <i className="bi bi-info-circle"></i>
        </div>
      </div>
    );
  }

  // Not connected state - show connect button
  if (!account) {
    return (
      <div className="d-flex align-items-center">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={connect}
          disabled={loading}
          className="connect-wallet-btn"
        >
          <i className="bi bi-wallet2 me-2"></i>
          Connect Wallet
        </Button>
      </div>
    );
  }

  /**
   * Tooltip component for copy button
   */
  const copyTooltip = (props: any) => (
    <Tooltip {...props}>
      {copied ? 'Address copied!' : 'Click to copy address'}
    </Tooltip>
  );

  // Connected state - show address with copy functionality
  return (
    <div className="metamask-account-container">
      <OverlayTrigger placement="bottom" overlay={copyTooltip}>
        <Badge
          bg="success"
          className="metamask-badge cursor-pointer"
          onClick={() => copyToClipboard(account)}
        >
          <div className="d-flex flex-column align-items-center">
            <small className="opacity-90">Connected Wallet Account:</small>
            <span className="font-monospace">{formatAddress(account)}</span>
          </div>
        </Badge>
      </OverlayTrigger>
    </div>
  );
};

export default MetaMaskAccount;
