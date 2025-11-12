import Web3 from "web3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve blockchain artifact path dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractPath = path.resolve(__dirname, "../../../../blockchain/build/contracts/AllocationContract.json");

let AllocationArtifact = { abi: [], networks: {} };
if (fs.existsSync(contractPath)) {
  AllocationArtifact = JSON.parse(fs.readFileSync(contractPath));
} else {
  console.warn("⚠️ AllocationContract.json not found at:", contractPath);
}

const web3 = new Web3(process.env.WEB3_PROVIDER || "http://127.0.0.1:7545");
const networks = AllocationArtifact.networks || {};
const firstNetwork = Object.keys(networks)[0];
const address = firstNetwork ? networks[firstNetwork].address : null;

if (!address) console.warn("⚠️ AllocationContract not deployed or address missing.");

const contract = address ? new web3.eth.Contract(AllocationArtifact.abi, address) : null;

async function safeSend(tx, from) {
  try {
    const gas = await tx.estimateGas({ from });
    const gasLimit = Math.min(Number(gas) + 100000, 6000000);
    const receipt = await tx.send({ from, gas: gasLimit });
    return { txHash: receipt?.transactionHash || null, onChain: true };
  } catch (err) {
    console.warn("⚠️ Blockchain transaction failed (Allocation):", err.message);
    return { txHash: null, onChain: false };
  }
}

export async function submitAllocationOnChain({ title, amount, from }) {
  // Don't record to blockchain when submitting - wait for approval
  // Blockchain requires captain approval, which happens in approveAllocationOnChain
  return { txHash: null, onChain: false };
}

export async function approveAllocationOnChain({ allocation, treasurerAddress, chairmanAddress }) {
  if (!contract) return { txHash: null, onChain: false };

  // Validate required fields
  if (!allocation.amount || allocation.amount <= 0) {
    console.warn("⚠️ Invalid allocation amount");
    return { txHash: null, onChain: false };
  }
  if (!allocation.purpose) {
    console.warn("⚠️ Allocation purpose is required");
    return { txHash: null, onChain: false };
  }
  if (!allocation.fundSource) {
    console.warn("⚠️ Allocation fund source is required");
    return { txHash: null, onChain: false };
  }
  if (!allocation.documentHash) {
    console.warn("⚠️ Document hash is required for blockchain recording");
    return { txHash: null, onChain: false };
  }

  // Map allocation data to blockchain contract parameters
  // Convert PHP to Wei (1 PHP = 1 ETH = 10^18 Wei)
  const amountInWei = web3.utils.toWei(String(allocation.amount), "ether");
  const allocationType = allocation.purpose;
  const fundType = allocation.fundSource;
  const documentHash = allocation.documentHash;

  const tx = contract.methods.recordAllocation(
    amountInWei,
    allocationType,
    fundType,
    documentHash,
    treasurerAddress,
    chairmanAddress
  );
  return await safeSend(tx, chairmanAddress);
}
