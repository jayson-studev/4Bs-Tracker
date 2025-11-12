// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBarangayOfficials {
    function isActiveOfficial(address _wallet) external view returns (bool);
}

// Custom errors for gas optimization
error InvalidAmount();
error RevenueSourceRequired();
error InvalidRevenueSource();
error DocumentHashRequired();
error InvalidDocumentHash();
error InvalidAddress();
error NotActiveOfficial();
error InvalidIncomeID();
error ReentrantCall();
error OffsetOutOfBounds();

contract IncomeContract {
    IBarangayOfficials public officialsContract;

    // Reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // Predefined revenue source categories
    mapping(bytes32 => bool) private validRevenueSources;

    struct Income {
        uint256 id;
        uint256 amount;
        string revenueSource;
        string documentHash;      // SHA-256 hex string of uploaded doc
        address treasurerAddress;
        uint256 timestamp;
    }

    event IncomeRecorded(
        uint256 indexed id,
        uint256 indexed amount,
        string revenueSource,
        address indexed treasurerAddress,
        uint256 timestamp
    );

    Income[] private incomes;
    uint256 public incomeCount;
    uint256 private totalIncomeAmount;

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

        // Initialize valid revenue sources
        validRevenueSources[keccak256(bytes("National Tax Allotment (NTA)"))] = true;
        validRevenueSources[keccak256(bytes("Share of Real Property Tax (RPT)"))] = true;
        validRevenueSources[keccak256(bytes("Share of Community Tax"))] = true;
        validRevenueSources[keccak256(bytes("Taxes on Stores/Retailers"))] = true;
        validRevenueSources[keccak256(bytes("Barangay Fees & Charges"))] = true;
        validRevenueSources[keccak256(bytes("Revenue from Operations"))] = true;
        validRevenueSources[keccak256(bytes("Grants, Aid, & Donations"))] = true;
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

    function isValidRevenueSource(string memory _revenueSource) private view returns (bool) {
        return validRevenueSources[keccak256(bytes(_revenueSource))];
    }

    function recordIncome(
        uint256 _amount,
        string memory _revenueSource,
        string memory _documentHash,
        address _treasurerAddress
    ) public onlyActiveOfficial nonReentrant returns (uint256) {
        require(_amount > 0, "Amount must be > 0");
        require(bytes(_revenueSource).length > 0, "Revenue source required");
        if (!isValidRevenueSource(_revenueSource)) revert InvalidRevenueSource();
        require(bytes(_documentHash).length > 0, "Document hash required");
        require(isValidDocumentHash(_documentHash), "Invalid document hash format (must be 64 hex characters)");
        require(_treasurerAddress != address(0), "Treasurer address required");
        require(officialsContract.isActiveOfficial(_treasurerAddress), "Treasurer must be active official");

        uint256 newId = incomeCount + 1;
        incomes.push(Income({
            id: newId,
            amount: _amount,
            revenueSource: _revenueSource,
            documentHash: _documentHash,
            treasurerAddress: _treasurerAddress,
            timestamp: block.timestamp
        }));
        incomeCount = newId;
        totalIncomeAmount += _amount;

        emit IncomeRecorded(newId, _amount, _revenueSource, _treasurerAddress, block.timestamp);
        return newId;
    }

    function getIncome(uint256 _id) public view returns (Income memory) {
        require(_id > 0 && _id <= incomeCount, "Invalid income ID");
        return incomes[_id - 1];
    }

    function getAllIncomes() public view returns (Income[] memory) {
        return incomes;
    }

    function getIncomesPaginated(uint256 _offset, uint256 _limit) public view returns (Income[] memory) {
        require(_offset < incomeCount, "Offset out of bounds");

        uint256 end = _offset + _limit;
        if (end > incomeCount) {
            end = incomeCount;
        }

        uint256 size = end - _offset;
        Income[] memory result = new Income[](size);

        for (uint256 i = 0; i < size; i++) {
            result[i] = incomes[_offset + i];
        }

        return result;
    }

    function getTotalIncome() public view returns (uint256) {
        return totalIncomeAmount;
    }

    function verifyIncomeDocument(uint256 _id, string memory _documentHash) public view returns (bool) {
        require(_id > 0 && _id <= incomeCount, "Invalid income ID");
        return keccak256(bytes(incomes[_id - 1].documentHash)) == keccak256(bytes(_documentHash));
    }

    function getValidRevenueSources() public pure returns (string[7] memory) {
        return [
            "National Tax Allotment (NTA)",
            "Share of Real Property Tax (RPT)",
            "Share of Community Tax",
            "Taxes on Stores/Retailers",
            "Barangay Fees & Charges",
            "Revenue from Operations",
            "Grants, Aid, & Donations"
        ];
    }
}
