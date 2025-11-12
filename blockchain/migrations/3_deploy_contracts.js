const BarangayOfficials = artifacts.require("BarangayOfficials");
const AllocationContract = artifacts.require("AllocationContract");
const IncomeContract = artifacts.require("IncomeContract");
const ExpenditureContract = artifacts.require("ExpenditureContract");
const ProposalContract = artifacts.require("ProposalContract");

module.exports = async function (deployer) {
  // Get the deployed BarangayOfficials contract address
  const officialsInstance = await BarangayOfficials.deployed();
  const officialsAddress = officialsInstance.address;

  console.log("BarangayOfficials address:", officialsAddress);

  // Deploy all contracts with officialsAddress as constructor parameter
  await deployer.deploy(AllocationContract, officialsAddress);
  await deployer.deploy(IncomeContract, officialsAddress);
  await deployer.deploy(ExpenditureContract, officialsAddress);
  await deployer.deploy(ProposalContract, officialsAddress);

  console.log("All contracts deployed successfully");
};
