// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BarangayOfficials {
    struct Official {
        string name;
        string email;
        string role;
        address wallet;
        uint256 termStart;
        uint256 termEnd;
        bool isActive;
    }

    mapping(address => Official) public officials;
    address[] private officialAddresses;
    address public systemAdmin;

    event OfficialRegistered(address indexed wallet, string indexed role, uint256 termStart, uint256 termEnd);
    event OfficialDeactivated(address indexed wallet, string reason);

    modifier onlySystem() {
        require(msg.sender == systemAdmin, "Only system can perform this action");
        _;
    }

    modifier onlyActiveOfficial() {
        require(officials[msg.sender].isActive, "Only active officials can perform this action");
        _;
    }

    constructor() {
        systemAdmin = msg.sender;
    }

    function registerOfficial(
        address _wallet,
        string memory _name,
        string memory _email,
        string memory _role,
        uint256 _termStart,
        uint256 _termEnd
    ) public onlySystem {
        require(_wallet != address(0), "Invalid wallet address");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_email).length > 0, "Email required");
        require(bytes(_role).length > 0, "Role required");

        // If not already registered, add to addresses array
        if (officials[_wallet].wallet == address(0)) {
            officialAddresses.push(_wallet);
        }

        officials[_wallet] = Official(_name, _email, _role, _wallet, _termStart, _termEnd, true);
        emit OfficialRegistered(_wallet, _role, _termStart, _termEnd);
    }

    function deactivateOfficial(address _wallet, string memory _reason) public onlySystem {
        require(officials[_wallet].wallet != address(0), "Official not found");
        require(officials[_wallet].isActive, "Official already inactive");
        officials[_wallet].isActive = false;
        emit OfficialDeactivated(_wallet, _reason);
    }

    function isActiveOfficial(address _wallet) public view returns (bool) {
        return officials[_wallet].isActive;
    }

    function getActiveOfficials() public view returns (Official[] memory) {
        uint256 activeCount = 0;

        // Count active officials
        for (uint256 i = 0; i < officialAddresses.length; i++) {
            if (officials[officialAddresses[i]].isActive) {
                activeCount++;
            }
        }

        // Build array of active officials
        Official[] memory activeOfficials = new Official[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < officialAddresses.length; i++) {
            if (officials[officialAddresses[i]].isActive) {
                activeOfficials[index] = officials[officialAddresses[i]];
                index++;
            }
        }

        return activeOfficials;
    }

    function getOfficial(address _wallet) public view returns (Official memory) {
        require(officials[_wallet].wallet != address(0), "Official not found");
        return officials[_wallet];
    }
}
