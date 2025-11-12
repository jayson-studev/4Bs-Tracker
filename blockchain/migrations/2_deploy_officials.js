const BarangayOfficials = artifacts.require("BarangayOfficials");
module.exports = function (deployer) {
  deployer.deploy(BarangayOfficials);
};
