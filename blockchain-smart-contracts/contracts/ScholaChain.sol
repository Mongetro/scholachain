// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ScholaChain - Blockchain-based Certificate Verification System
/// @notice Issues and verifies tamper-proof certificates using Ethereum blockchain
contract ScholaChain {
    // ==================== ENUMS & STRUCTURES ====================

    /// @notice Certificate data structure
    struct Certificate {
        string documentHash; // SHA-256 hash of the certificate document
        string ipfsCID; // IPFS Content Identifier for document storage
        address issuer; // Institution that issued the certificate
        address holder; // Recipient of the certificate
        uint256 issuedAt; // Timestamp of issuance
        bool revoked; // Revocation status
        string certificateType; // Type of certificate (e.g., "Bachelor Degree")
    }

    // ==================== STATE VARIABLES ====================

    // Certificate registry
    Certificate[] public certificates;

    // Governance contract reference for issuer authorization
    address public governanceContract;

    // Statistics
    uint256 public totalCertificates;
    uint256 public activeCertificates;

    // ==================== EVENTS ====================

    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed issuer,
        address indexed holder,
        string documentHash,
        string ipfsCID,
        uint256 issuedAt
    );

    event CertificateRevoked(
        uint256 indexed certificateId,
        address revokedBy,
        uint256 revokedAt
    );

    event CertificateVerified(
        uint256 indexed certificateId,
        address verifiedBy,
        bool isValid,
        uint256 verifiedAt
    );

    // ==================== MODIFIERS ====================

    /// @notice Restrict access to authorized issuers only
    modifier onlyAuthorizedIssuer() {
        require(
            _isAuthorizedIssuer(msg.sender),
            "ScholaChain: Not authorized issuer"
        );
        _;
    }

    /// @notice Ensure certificate exists
    modifier certificateExists(uint256 _certificateId) {
        require(
            _certificateId < certificates.length,
            "ScholaChain: Certificate does not exist"
        );
        _;
    }

    // ==================== CONSTRUCTOR ====================

    /// @notice Deploys the ScholaChain contract with governance reference
    /// @param _governanceAddress Address of the ScholaChainGovernance contract
    constructor(address _governanceAddress) {
        require(
            _governanceAddress != address(0),
            "ScholaChain: Invalid governance address"
        );
        governanceContract = _governanceAddress;
    }

    // ==================== EXTERNAL FUNCTIONS ====================

    /// @notice Issue a new certificate
    /// @dev Only callable by authorized issuers
    /// @param _documentHash SHA-256 hash of the certificate document
    /// @param _ipfsCID IPFS Content Identifier for document storage
    /// @param _holder Address of the certificate recipient
    /// @param _certificateType Type of certificate being issued
    /// @return certificateId The ID of the newly issued certificate
    function issueCertificate(
        string memory _documentHash,
        string memory _ipfsCID,
        address _holder,
        string memory _certificateType
    ) external onlyAuthorizedIssuer returns (uint256) {
        require(
            bytes(_documentHash).length == 66,
            "ScholaChain: Invalid document hash"
        );
        require(bytes(_ipfsCID).length > 0, "ScholaChain: IPFS CID required");
        require(_holder != address(0), "ScholaChain: Invalid holder address");
        require(_holder != msg.sender, "ScholaChain: Cannot issue to self");

        // Create new certificate
        Certificate memory newCertificate = Certificate({
            documentHash: _documentHash,
            ipfsCID: _ipfsCID,
            issuer: msg.sender,
            holder: _holder,
            issuedAt: block.timestamp,
            revoked: false,
            certificateType: _certificateType
        });

        certificates.push(newCertificate);
        uint256 certificateId = certificates.length - 1;

        totalCertificates++;
        activeCertificates++;

        emit CertificateIssued(
            certificateId,
            msg.sender,
            _holder,
            _documentHash,
            _ipfsCID,
            block.timestamp
        );

        return certificateId;
    }

    /// @notice Revoke an existing certificate
    /// @dev Only the original issuer or governance can revoke
    /// @param _certificateId ID of the certificate to revoke
    function revokeCertificate(
        uint256 _certificateId
    ) external certificateExists(_certificateId) {
        Certificate storage certificate = certificates[_certificateId];

        require(
            msg.sender == certificate.issuer || _isSuperAdmin(msg.sender),
            "ScholaChain: Only issuer or super admin can revoke"
        );
        require(
            !certificate.revoked,
            "ScholaChain: Certificate already revoked"
        );

        certificate.revoked = true;
        activeCertificates--;

        emit CertificateRevoked(_certificateId, msg.sender, block.timestamp);
    }

    /// @notice Verify a certificate's authenticity
    /// @param _certificateId ID of the certificate to verify
    /// @param _documentHash Document hash to verify against
    /// @return isValid Whether the certificate is valid and matches the hash
    /// @return issuer Address of the certificate issuer
    /// @return holder Address of the certificate holder
    /// @return isRevoked Whether the certificate has been revoked
    function verifyCertificate(
        uint256 _certificateId,
        string memory _documentHash
    )
        external
        view
        certificateExists(_certificateId)
        returns (bool isValid, address issuer, address holder, bool isRevoked)
    {
        Certificate memory certificate = certificates[_certificateId];

        isValid =
            keccak256(bytes(certificate.documentHash)) ==
            keccak256(bytes(_documentHash)) &&
            !certificate.revoked;
        issuer = certificate.issuer;
        holder = certificate.holder;
        isRevoked = certificate.revoked;

        // NOTE: Removed event emission from view function
        // Events cannot be emitted from view functions in Solidity
    }

    // ==================== VIEW FUNCTIONS ====================

    /// @notice Get certificate details by ID
    /// @param _certificateId ID of the certificate
    /// @return Certificate details
    function getCertificate(
        uint256 _certificateId
    )
        external
        view
        certificateExists(_certificateId)
        returns (Certificate memory)
    {
        return certificates[_certificateId];
    }

    /// @notice Get total number of certificates
    /// @return Total certificates count
    function getTotalCertificates() external view returns (uint256) {
        return certificates.length;
    }

    /// @notice Check if an address is authorized to issue certificates
    /// @param _issuer Address to check
    /// @return bool True if authorized
    function isIssuerAuthorized(address _issuer) external view returns (bool) {
        return _isAuthorizedIssuer(_issuer);
    }

    // ==================== INTERNAL FUNCTIONS ====================

    /// @notice Check if an address is an authorized issuer via governance contract
    /// @param _issuer Address to check
    /// @return bool True if authorized
    function _isAuthorizedIssuer(address _issuer) internal view returns (bool) {
        // Interface for governance contract
        ScholaChainGovernance governance = ScholaChainGovernance(
            governanceContract
        );

        try governance.canIssueCertificates(_issuer) returns (bool authorized) {
            return authorized;
        } catch {
            return false;
        }
    }

    /// @notice Check if an address is a super admin via governance contract
    /// @param _address Address to check
    /// @return bool True if super admin
    function _isSuperAdmin(address _address) internal view returns (bool) {
        ScholaChainGovernance governance = ScholaChainGovernance(
            governanceContract
        );

        try governance.isSuperAdmin(_address) returns (bool isAdmin) {
            return isAdmin;
        } catch {
            return false;
        }
    }
}

// Minimal interface for governance contract
interface ScholaChainGovernance {
    function canIssueCertificates(address _issuer) external view returns (bool);

    function isSuperAdmin(address _address) external view returns (bool);
}
