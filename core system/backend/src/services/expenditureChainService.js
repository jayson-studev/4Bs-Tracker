import Web3 from "web3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractPath = path.resolve(__dirname, "../../../../blockchain/build/contracts/ExpenditureContract.json");

let ExpenditureArtifact = { abi: [], networks: {} };
if (fs.existsSync(contractPath)) {
  ExpenditureArtifact = JSON.parse(fs.readFileSync(contractPath));
} else {
  console.warn("⚠️ ExpenditureContract.json not found at:", contractPath);
}

const web3 = new Web3(process.env.WEB3_PROVIDER || "http://127.0.0.1:7545");
const networks = ExpenditureArtifact.networks || {};
const firstNetwork = Object.keys(networks)[0];
const address = firstNetwork ? networks[firstNetwork].address : null;

if (!address) console.warn("⚠️ ExpenditureContract not deployed or address missing.");

const contract = address ? new web3.eth.Contract(ExpenditureArtifact.abi, address) : null;

async function safeSend(tx, from) {
  try {
    const gas = await tx.estimateGas({ from });
    const gasLimit = Math.min(Number(gas) + 100000, 6000000);
    const receipt = await tx.send({ from, gas: gasLimit });
    return { txHash: receipt?.transactionHash || null, onChain: true };
  } catch (err) {
    console.warn("⚠️ Blockchain transaction failed (Expenditure):", err.message);
    return { txHash: null, onChain: false };
  }
}

// Expenditure is only recorded on chain when approved by Chairman
export async function approveExpenditureOnChain({ expenditure, treasurerAddress, chairmanAddress }) {
  if (!contract) return { txHash: null, onChain: false };

  // Validate required fields
  if (!expenditure.amount || expenditure.amount <= 0) {
    console.warn("⚠️ Invalid expenditure amount");
    return { txHash: null, onChain: false };
  }
  if (!expenditure.purpose) {
    console.warn("⚠️ Expenditure purpose is required");
    return { txHash: null, onChain: false };
  }
  if (!expenditure.fundSource) {
    console.warn("⚠️ Expenditure fund source is required");
    return { txHash: null, onChain: false };
  }
  if (!expenditure.documentHash) {
    console.warn("⚠️ Document hash is required for blockchain recording");
    return { txHash: null, onChain: false };
  }

  // Convert PHP to Wei (1 PHP = 1 ETH = 10^18 Wei)
  const amountInWei = web3.utils.toWei(String(expenditure.amount), "ether");
  const purpose = expenditure.purpose;
  const fundSource = expenditure.fundSource;
  const documentHash = expenditure.documentHash;
  const proposalId = String(expenditure.proposalId || 0);

  const tx = contract.methods.recordExpenditure(
    amountInWei,
    purpose,
    fundSource,
    documentHash,
    proposalId,
    treasurerAddress,
    chairmanAddress
  );
  return await safeSend(tx, chairmanAddress);
}
