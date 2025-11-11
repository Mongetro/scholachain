// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ScholaChainGovernance - Role-based access control for certificate issuers
/// @notice Manages institution registration and role assignments with revocation capabilities
contract ScholaChainGovernance {
    // ==================== ENUMS & STRUCTURES ====================

    /// @notice User roles in the system
    enum Role {
        NONE, // 0 - No role
        ISSUER, // 1 - Certificate issuer
        SUPER_ADMIN // 2 - System administrator
    }

    /// @notice Institution data structure
    struct Institution {
        string name;
        string description;
        string website;
        bool isActive;
        uint256 registeredAt;
        Role role;
    }

    // ==================== STATE VARIABLES ====================

    // Institution registry
    mapping(address => Institution) public institutions;

    // Quick lookup for authorized issuers
    mapping(address => bool) public authorizedIssuers;

    // Super admin address (deployer)
    address public superAdmin;

    // Statistics
    uint256 public totalInstitutions;
    uint256 public activeIssuers;

    // ==================== EVENTS ====================

    event InstitutionRegistered(
        address indexed institutionAddress,
        string name,
        Role role,
        address registeredBy
    );

    event InstitutionUpdated(
        address indexed institutionAddress,
        string name,
        Role previousRole,
        Role newRole
    );

    event InstitutionStatusChanged(
        address indexed institutionAddress,
        bool newStatus,
        address changedBy
    );

    event InstitutionRevoked(
        address indexed institutionAddress,
        string reason,
        address revokedBy
    );

    event SuperAdminTransferred(
        address indexed previousAdmin,
        address indexed newAdmin
    );

    // ==================== MODIFIERS ====================

    /// @notice Restrict access to super admin only
    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "ScholaChain: Only super admin");
        _;
    }

    /// @notice Restrict access to active institutions only
    modifier onlyActiveInstitution() {
        require(
            institutions[msg.sender].isActive,
            "ScholaChain: Institution inactive"
        );
        _;
    }

    // ==================== CONSTRUCTOR ====================

    /// @notice Deploys the governance contract
    /// @param _ministryAddress The address of the ministry/initial super admin
    constructor(address _ministryAddress) {
        require(
            _ministryAddress != address(0),
            "ScholaChain: Invalid ministry address"
        );

        superAdmin = _ministryAddress;

        // Register the ministry as the initial super admin
        institutions[_ministryAddress] = Institution({
            name: "Ministry of Education",
            description: "Governing body for educational certification",
            website: "https://education.gov",
            isActive: true,
            registeredAt: block.timestamp,
            role: Role.SUPER_ADMIN
        });

        totalInstitutions = 1;

        emit InstitutionRegistered(
            _ministryAddress,
            "Ministry of Education",
            Role.SUPER_ADMIN,
            address(this)
        );
    }

    // ==================== ADMIN FUNCTIONS ====================

    /// @notice Register a new institution with a specific role
    /// @dev Only callable by super admin
    /// @param _institutionAddress The Ethereum address of the institution
    /// @param _name Official name of the institution
    /// @param _description Brief description of the institution
    /// @param _website Official website URL
    /// @param _role Role to assign (ISSUER or SUPER_ADMIN)
    function registerInstitution(
        address _institutionAddress,
        string memory _name,
        string memory _description,
        string memory _website,
        Role _role
    ) external onlySuperAdmin returns (bool) {
        require(
            _institutionAddress != address(0),
            "ScholaChain: Invalid address"
        );
        require(bytes(_name).length > 0, "ScholaChain: Name required");
        require(
            institutions[_institutionAddress].role == Role.NONE,
            "ScholaChain: Already registered"
        );
        require(_role != Role.NONE, "ScholaChain: Invalid role");

        institutions[_institutionAddress] = Institution({
            name: _name,
            description: _description,
            website: _website,
            isActive: true,
            registeredAt: block.timestamp,
            role: _role
        });

        totalInstitutions++;

        // Add to authorized issuers if role is ISSUER
        if (_role == Role.ISSUER) {
            authorizedIssuers[_institutionAddress] = true;
            activeIssuers++;
        }

        emit InstitutionRegistered(
            _institutionAddress,
            _name,
            _role,
            msg.sender
        );

        return true;
    }

    /// @notice Revoke an institution's certificate issuance rights
    /// @dev Only callable by super admin, maintains institution record but revokes issuance rights
    /// @param _institutionAddress The institution's address to revoke
    /// @param _reason Reason for revocation for transparency
    function revokeInstitution(
        address _institutionAddress,
        string memory _reason
    ) external onlySuperAdmin returns (bool) {
        require(
            _institutionAddress != address(0),
            "ScholaChain: Invalid address"
        );
        require(
            institutions[_institutionAddress].role != Role.NONE,
            "ScholaChain: Institution not registered"
        );
        require(
            institutions[_institutionAddress].isActive,
            "ScholaChain: Institution already inactive"
        );
        require(
            institutions[_institutionAddress].role == Role.ISSUER,
            "ScholaChain: Can only revoke issuers"
        );

        // Deactivate the institution
        institutions[_institutionAddress].isActive = false;

        // Remove from authorized issuers
        authorizedIssuers[_institutionAddress] = false;
        activeIssuers--;

        emit InstitutionStatusChanged(_institutionAddress, false, msg.sender);
        emit InstitutionRevoked(_institutionAddress, _reason, msg.sender);

        return true;
    }

    /// @notice Reactivate a previously revoked institution
    /// @dev Only callable by super admin
    /// @param _institutionAddress The institution's address to reactivate
    function reactivateInstitution(
        address _institutionAddress
    ) external onlySuperAdmin returns (bool) {
        require(
            _institutionAddress != address(0),
            "ScholaChain: Invalid address"
        );
        require(
            institutions[_institutionAddress].role != Role.NONE,
            "ScholaChain: Institution not registered"
        );
        require(
            !institutions[_institutionAddress].isActive,
            "ScholaChain: Institution already active"
        );
        require(
            institutions[_institutionAddress].role == Role.ISSUER,
            "ScholaChain: Can only reactivate issuers"
        );

        // Reactivate the institution
        institutions[_institutionAddress].isActive = true;

        // Add back to authorized issuers
        authorizedIssuers[_institutionAddress] = true;
        activeIssuers++;

        emit InstitutionStatusChanged(_institutionAddress, true, msg.sender);

        return true;
    }

    /// @notice Update an institution's role
    /// @dev Only callable by super admin
    /// @param _institutionAddress The institution's address
    /// @param _newRole New role to assign
    function updateInstitutionRole(
        address _institutionAddress,
        Role _newRole
    ) external onlySuperAdmin returns (bool) {
        require(
            _institutionAddress != address(0),
            "ScholaChain: Invalid address"
        );
        require(
            institutions[_institutionAddress].role != Role.NONE,
            "ScholaChain: Not registered"
        );
        require(_newRole != Role.NONE, "ScholaChain: Invalid role");

        Role previousRole = institutions[_institutionAddress].role;
        institutions[_institutionAddress].role = _newRole;

        // Update authorized issuers mapping
        if (previousRole == Role.ISSUER && _newRole != Role.ISSUER) {
            authorizedIssuers[_institutionAddress] = false;
            if (institutions[_institutionAddress].isActive) {
                activeIssuers--;
            }
        } else if (previousRole != Role.ISSUER && _newRole == Role.ISSUER) {
            authorizedIssuers[_institutionAddress] = true;
            if (institutions[_institutionAddress].isActive) {
                activeIssuers++;
            }
        }

        emit InstitutionUpdated(
            _institutionAddress,
            institutions[_institutionAddress].name,
            previousRole,
            _newRole
        );

        return true;
    }

    /// @notice Suspend or reactivate an institution
    /// @dev Only callable by super admin
    /// @param _institutionAddress The institution's address
    /// @param _isActive New active status
    function setInstitutionStatus(
        address _institutionAddress,
        bool _isActive
    ) external onlySuperAdmin returns (bool) {
        require(
            _institutionAddress != address(0),
            "ScholaChain: Invalid address"
        );
        require(
            institutions[_institutionAddress].role != Role.NONE,
            "ScholaChain: Not registered"
        );
        require(
            institutions[_institutionAddress].isActive != _isActive,
            "ScholaChain: Status unchanged"
        );

        institutions[_institutionAddress].isActive = _isActive;

        // Update authorized issuers count
        if (institutions[_institutionAddress].role == Role.ISSUER) {
            if (_isActive) {
                authorizedIssuers[_institutionAddress] = true;
                activeIssuers++;
            } else {
                authorizedIssuers[_institutionAddress] = false;
                activeIssuers--;
            }
        }

        emit InstitutionStatusChanged(
            _institutionAddress,
            _isActive,
            msg.sender
        );
        return true;
    }

    /// @notice Transfer super admin role to another institution
    /// @dev Only callable by current super admin
    /// @param _newSuperAdmin Address of the new super admin
    function transferSuperAdmin(
        address _newSuperAdmin
    ) external onlySuperAdmin returns (bool) {
        require(_newSuperAdmin != address(0), "ScholaChain: Invalid address");
        require(
            institutions[_newSuperAdmin].role != Role.NONE,
            "ScholaChain: Not registered"
        );
        require(_newSuperAdmin != superAdmin, "ScholaChain: Same admin");

        // Update roles
        institutions[superAdmin].role = Role.ISSUER; // Demote current admin to issuer
        institutions[_newSuperAdmin].role = Role.SUPER_ADMIN;

        // Update authorized issuers
        authorizedIssuers[superAdmin] = true; // Current admin becomes issuer
        authorizedIssuers[_newSuperAdmin] = false; // New admin is no longer issuer

        address previousAdmin = superAdmin;
        superAdmin = _newSuperAdmin;

        emit InstitutionUpdated(
            previousAdmin,
            institutions[previousAdmin].name,
            Role.SUPER_ADMIN,
            Role.ISSUER
        );
        emit InstitutionUpdated(
            _newSuperAdmin,
            institutions[_newSuperAdmin].name,
            Role.ISSUER,
            Role.SUPER_ADMIN
        );
        emit SuperAdminTransferred(previousAdmin, _newSuperAdmin);

        return true;
    }

    // ==================== VIEW FUNCTIONS ====================

    /// @notice Check if an address can issue certificates
    /// @param _issuer The address to check
    /// @return bool True if authorized and active
    function canIssueCertificates(
        address _issuer
    ) external view returns (bool) {
        return authorizedIssuers[_issuer] && institutions[_issuer].isActive;
    }

    /// @notice Get complete institution details
    /// @param _institutionAddress The institution's address
    /// @return Institution details
    function getInstitution(
        address _institutionAddress
    ) external view returns (Institution memory) {
        return institutions[_institutionAddress];
    }

    /// @notice Get institution role
    /// @param _institutionAddress The institution's address
    /// @return Role Current role
    function getInstitutionRole(
        address _institutionAddress
    ) external view returns (Role) {
        return institutions[_institutionAddress].role;
    }

    /// @notice Check if institution is active
    /// @param _institutionAddress The institution's address
    /// @return bool True if active
    function isInstitutionActive(
        address _institutionAddress
    ) external view returns (bool) {
        return institutions[_institutionAddress].isActive;
    }

    /// @notice Verify if address has super admin role
    /// @param _address Address to check
    /// @return bool True if super admin
    function isSuperAdmin(address _address) external view returns (bool) {
        return
            institutions[_address].role == Role.SUPER_ADMIN &&
            _address == superAdmin;
    }

    /// @notice Get total number of active issuers
    /// @return uint256 Count of active issuers
    function getActiveIssuersCount() external view returns (uint256) {
        return activeIssuers;
    }

    /// @notice Check if institution is revoked (registered but inactive)
    /// @param _institutionAddress The institution's address
    /// @return bool True if revoked
    function isInstitutionRevoked(
        address _institutionAddress
    ) external view returns (bool) {
        return
            institutions[_institutionAddress].role != Role.NONE &&
            !institutions[_institutionAddress].isActive;
    }
}
