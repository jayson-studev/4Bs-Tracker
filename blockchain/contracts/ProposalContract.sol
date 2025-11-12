// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBarangayOfficials {
    function isActiveOfficial(address _wallet) external view returns (bool);
}

// Custom errors for gas optimization
error InvalidFundSource();

contract ProposalContract {
    IBarangayOfficials public officialsContract;

    // Reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // Predefined fund source categories (same as allocation types)
    mapping(bytes32 => bool) private validFundSources;

    struct Proposal {
        uint256 id;
        uint256 amount;
        string purpose;
        string fundSource;    // Must be one of the 8 allocation types
        string expenseType;   // e.g., infrastructure, health, etc.
        string proposer;      // name or role
        string documentHash;
        address treasurerAddress;
        address chairmanAddress;
        uint256 timestamp;
    }

    event ProposalRecorded(
        uint256 indexed id,
        uint256 indexed amount,
        string purpose,
        string fundSource,
        string expenseType,
        string proposer,
        address indexed treasurerAddress,
        address chairmanAddress,
        uint256 timestamp
    );

    Proposal[] private proposals;
    uint256 public proposalCount;
    uint256 private totalProposalAmount;

    modifier onlyActiveOfficial() {
        require(officialsContract.isActiveOfficial(msg.sender), "Only active officials can perform this action");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(address _officialsContractAddress) {
        require(_officialsContractAddress != address(0), "Invalid officials contract address");
        officialsContract = IBarangayOfficials(_officialsContractAddress);
        _status = _NOT_ENTERED;

        // Initialize valid fund sources (same as allocation types)
        validFundSources[keccak256(bytes("Barangay Development Fund (BDP)"))] = true;
        validFundSources[keccak256(bytes("Sangguniang Kabataan (SK) Fund"))] = true;
        validFundSources[keccak256(bytes("Calamity Fund (LDRRMF)"))] = true;
        validFundSources[keccak256(bytes("Gender and Development (GAD) Fund"))] = true;
        validFundSources[keccak256(bytes("Senior Citizens & Persons with Disability (PWD) Fund"))] = true;
        validFundSources[keccak256(bytes("Local Council for the Protection of Children (LCPC) Fund"))] = true;
        validFundSources[keccak256(bytes("Personal Services (PS)"))] = true;
        validFundSources[keccak256(bytes("Maintenance and Other Operating Expenses (MOOE)"))] = true;
    }

    function isValidDocumentHash(string memory _hash) private pure returns (bool) {
        bytes memory hashBytes = bytes(_hash);
        if (hashBytes.length != 64) return false;

        for (uint i = 0; i < hashBytes.length; i++) {
            bytes1 char = hashBytes[i];
            if (!(char >= 0x30 && char <= 0x39) && // 0-9
                !(char >= 0x61 && char <= 0x66) && // a-f
                !(char >= 0x41 && char <= 0x46))   // A-F
                return false;
        }
        return true;
    }

    function isValidFundSource(string memory _fundSource) private view returns (bool) {
        return validFundSources[keccak256(bytes(_fundSource))];
    }

    function recordProposal(
        uint256 _amount,
        string memory _purpose,
        string memory _fundSource,
        string memory _expenseType,
        string memory _proposer,
        string memory _documentHash,
        address _treasurerAddress,
        address _chairmanAddress
    ) public onlyActiveOfficial nonReentrant returns (uint256) {
        require(_amount > 0, "Amount must be > 0");
        require(bytes(_purpose).length > 0, "Purpose required");
        require(bytes(_fundSource).length > 0, "Fund source required");
        if (!isValidFundSource(_fundSource)) revert InvalidFundSource();
        require(bytes(_expenseType).length > 0, "Expense type required");
        require(bytes(_proposer).length > 0, "Proposer required");
        require(bytes(_documentHash).length > 0, "Document hash required");
        require(isValidDocumentHash(_documentHash), "Invalid document hash format (must be 64 hex characters)");
        require(_treasurerAddress != address(0), "Treasurer address required");
        require(officialsContract.isActiveOfficial(_treasurerAddress), "Treasurer must be active official");
        // Approval check
        require(_chairmanAddress != address(0), "Proposal must be approved by chairman");
        require(officialsContract.isActiveOfficial(_chairmanAddress), "Chairman must be active official");

        uint256 newId = proposalCount + 1;
        proposals.push(Proposal({
            id: newId,
            amount: _amount,
            purpose: _purpose,
            fundSource: _fundSource,
            expenseType: _expenseType,
            proposer: _proposer,
            documentHash: _documentHash,
            treasurerAddress: _treasurerAddress,
            chairmanAddress: _chairmanAddress,
            timestamp: block.timestamp
        }));
        proposalCount = newId;
        totalProposalAmount += _amount;

        emit ProposalRecorded(newId, _amount, _purpose, _fundSource, _expenseType, _proposer, _treasurerAddress, _chairmanAddress, block.timestamp);
        return newId;
    }

    function getProposal(uint256 _id) public view returns (Proposal memory) {
        require(_id > 0 && _id <= proposalCount, "Invalid proposal ID");
        return proposals[_id - 1];
    }

    function getAllProposals() public view returns (Proposal[] memory) {
        return proposals;
    }

    function getProposalsPaginated(uint256 _offset, uint256 _limit) public view returns (Proposal[] memory) {
        require(_offset < proposalCount, "Offset out of bounds");

        uint256 end = _offset + _limit;
        if (end > proposalCount) {
            end = proposalCount;
        }

        uint256 size = end - _offset;
        Proposal[] memory result = new Proposal[](size);

        for (uint256 i = 0; i < size; i++) {
            result[i] = proposals[_offset + i];
        }

        return result;
    }

    function getTotalProposalAmount() public view returns (uint256) {
        return totalProposalAmount;
    }

    function verifyProposalDocument(uint256 _id, string memory _documentHash) public view returns (bool) {
        require(_id > 0 && _id <= proposalCount, "Invalid proposal ID");
        return keccak256(bytes(proposals[_id - 1].documentHash)) == keccak256(bytes(_documentHash));
    }

    function getValidFundSources() public pure returns (string[8] memory) {
        return [
            "Barangay Development Fund (BDP)",
            "Sangguniang Kabataan (SK) Fund",
            "Calamity Fund (LDRRMF)",
            "Gender and Development (GAD) Fund",
            "Senior Citizens & Persons with Disability (PWD) Fund",
            "Local Council for the Protection of Children (LCPC) Fund",
            "Personal Services (PS)",
            "Maintenance and Other Operating Expenses (MOOE)"
        ];
    }
}
