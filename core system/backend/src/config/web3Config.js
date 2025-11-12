import Web3 from "web3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
const web3 = new Web3(provider);

// Load contract ABI + address
const getContractInstance = (name) => {
  const contractPath = path.resolve("src/contracts", `${name}.json`);
  const artifact = JSON.parse(fs.readFileSync(contractPath, "utf-8"));
  const { abi, networks } = artifact;

  // Replace with your actual Ganache network id
  const networkId = Object.keys(networks)[0];
  const address = networks[networkId].address;

  return new web3.eth.Contract(abi, address);
};

export default { web3, getContractInstance };
