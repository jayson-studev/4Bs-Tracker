// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBarangayOfficials {
    function isActiveOfficial(address _wallet) external view returns (bool);
}

// Custom errors for gas optimization
error InvalidAmount();
error AllocTypeRequired();
error InvalidAllocationType();
error FundTypeRequired();
error DocumentHashRequired();
error InvalidDocumentHash();
error InvalidAddress();
error NotActiveOfficial();
error ApprovalRequired();
error InvalidAllocationID();
error ReentrantCall();
error OffsetOutOfBounds();

contract AllocationContract {
    IBarangayOfficials public officialsContract;

    // Reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // Predefined allocation type categories
    mapping(bytes32 => bool) private validAllocationTypes;

    struct Allocation {
        uint256 id;
        uint256 amount;
        string allocationType;
        string fundType;          // General Fund / Trust Fund
        string documentHash;      // SHA-256 hex string
        address treasurerAddress;
        address chairmanAddress;
        uint256 timestamp;        // block timestamp at record
    }

    event AllocationRecorded(
        uint256 indexed id,
        uint256 indexed amount,
        string allocationType,
        address indexed treasurerAddress,
        address chairmanAddress,
        uint256 timestamp
    );

    Allocation[] private allocations;
    uint256 public allocationCount;
    uint256 private totalAllocationAmount;

    modifier onlyActiveOfficial() {
        if (!officialsContract.isActiveOfficial(msg.sender)) revert NotActiveOfficial();
        _;
    }

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(address _officialsContractAddress) {
        if (_officialsContractAddress == address(0)) revert InvalidAddress();
        officialsContract = IBarangayOfficials(_officialsContractAddress);
        _status = _NOT_ENTERED;

        // Initialize valid allocation types
        validAllocationTypes[keccak256(bytes("Barangay Development Fund (BDP)"))] = true;
        validAllocationTypes[keccak256(bytes("Sangguniang Kabataan (SK) Fund"))] = true;
        validAllocationTypes[keccak256(bytes("Calamity Fund (LDRRMF)"))] = true;
        validAllocationTypes[keccak256(bytes("Gender and Development (GAD) Fund"))] = true;
        validAllocationTypes[keccak256(bytes("Senior Citizens & Persons with Disability (PWD) Fund"))] = true;
        validAllocationTypes[keccak256(bytes("Local Council for the Protection of Children (LCPC) Fund"))] = true;
        validAllocationTypes[keccak256(bytes("Personal Services (PS)"))] = true;
        validAllocationTypes[keccak256(bytes("Maintenance and Other Operating Expenses (MOOE)"))] = true;
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

    function isValidAllocationType(string memory _allocationType) private view returns (bool) {
        return validAllocationTypes[keccak256(bytes(_allocationType))];
    }

    function recordAllocation(
        uint256 _amount,
        string memory _allocationType,
        string memory _fundType,
        string memory _documentHash,
        address _treasurerAddress,
        address _chairmanAddress
    ) public onlyActiveOfficial nonReentrant returns (uint256) {
        if (_amount == 0) revert InvalidAmount();
        if (bytes(_allocationType).length == 0) revert AllocTypeRequired();
        if (!isValidAllocationType(_allocationType)) revert InvalidAllocationType();
        if (bytes(_fundType).length == 0) revert FundTypeRequired();
        if (bytes(_documentHash).length == 0) revert DocumentHashRequired();
        if (!isValidDocumentHash(_documentHash)) revert InvalidDocumentHash();
        if (_treasurerAddress == address(0)) revert InvalidAddress();
        if (!officialsContract.isActiveOfficial(_treasurerAddress)) revert NotActiveOfficial();
        // Approval check: chairman address must be present
        if (_chairmanAddress == address(0)) revert ApprovalRequired();
        if (!officialsContract.isActiveOfficial(_chairmanAddress)) revert NotActiveOfficial();

        uint256 newId = allocationCount + 1;
        allocations.push(Allocation({
            id: newId,
            amount: _amount,
            allocationType: _allocationType,
            fundType: _fundType,
            documentHash: _documentHash,
            treasurerAddress: _treasurerAddress,
            chairmanAddress: _chairmanAddress,
            timestamp: block.timestamp
        }));

        allocationCount = newId;
        totalAllocationAmount += _amount;
        emit AllocationRecorded(newId, _amount, _allocationType, _treasurerAddress, _chairmanAddress, block.timestamp);
        return newId;
    }

    function getTotalAllocationAmount() public view returns (uint256) {
        return totalAllocationAmount;
    }

    function getAllocation(uint256 _id) public view returns (Allocation memory) {
        if (_id == 0 || _id > allocationCount) revert InvalidAllocationID();
        return allocations[_id - 1];
    }

    function getAllAllocations() public view returns (Allocation[] memory) {
        return allocations;
    }

    function getAllocationsPaginated(uint256 _offset, uint256 _limit) public view returns (Allocation[] memory) {
        if (_offset >= allocationCount) revert OffsetOutOfBounds();

        uint256 end = _offset + _limit;
        if (end > allocationCount) {
            end = allocationCount;
        }

        uint256 size = end - _offset;
        Allocation[] memory result = new Allocation[](size);

        for (uint256 i = 0; i < size; i++) {
            result[i] = allocations[_offset + i];
        }

        return result;
    }

    function verifyAllocationDocument(uint256 _id, string memory _documentHash) public view returns (bool) {
        if (_id == 0 || _id > allocationCount) revert InvalidAllocationID();
        return keccak256(bytes(allocations[_id - 1].documentHash)) == keccak256(bytes(_documentHash));
    }

    function getValidAllocationTypes() public pure returns (string[8] memory) {
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
