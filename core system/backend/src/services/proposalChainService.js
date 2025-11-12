import Web3 from "web3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractPath = path.resolve(__dirname, "../../../../blockchain/build/contracts/ProposalContract.json");

let ProposalArtifact = { abi: [], networks: {} };
if (fs.existsSync(contractPath)) {
  ProposalArtifact = JSON.parse(fs.readFileSync(contractPath));
} else {
  console.warn("⚠️ ProposalContract.json not found at:", contractPath);
}

const web3 = new Web3(process.env.WEB3_PROVIDER || "http://127.0.0.1:7545");
const networks = ProposalArtifact.networks || {};
const firstNetwork = Object.keys(networks)[0];
const address = firstNetwork ? networks[firstNetwork].address : null;

if (!address) console.warn("⚠️ ProposalContract not deployed or address missing.");

const contract = address ? new web3.eth.Contract(ProposalArtifact.abi, address) : null;

async function safeSend(tx, from) {
  try {
    const gas = await tx.estimateGas({ from });
    const gasLimit = Math.min(Number(gas) + 100000, 6000000);
    const receipt = await tx.send({ from, gas: gasLimit });
    return { txHash: receipt?.transactionHash || null, onChain: true };
  } catch (err) {
    console.warn("⚠️ Blockchain transaction failed (Proposal):", err.message);
    return { txHash: null, onChain: false };
  }
}

// Proposal is only recorded on chain when approved by Chairman
export async function approveProposalOnChain({ proposal, treasurerAddress, chairmanAddress }) {
  if (!contract) return { txHash: null, onChain: false };

  // Validate required fields
  if (!proposal.amount || proposal.amount <= 0) {
    console.warn("⚠️ Invalid proposal amount");
    return { txHash: null, onChain: false };
  }
  if (!proposal.purpose) {
    console.warn("⚠️ Proposal purpose is required");
    return { txHash: null, onChain: false };
  }
  if (!proposal.fundSource) {
    console.warn("⚠️ Proposal fund source is required");
    return { txHash: null, onChain: false };
  }
  if (!proposal.expenseType) {
    console.warn("⚠️ Proposal expense type is required");
    return { txHash: null, onChain: false };
  }
  if (!proposal.proposer) {
    console.warn("⚠️ Proposal proposer is required");
    return { txHash: null, onChain: false };
  }
  if (!proposal.documentHash) {
    console.warn("⚠️ Document hash is required for blockchain recording");
    return { txHash: null, onChain: false };
  }

  // Convert PHP to Wei (1 PHP = 1 ETH = 10^18 Wei)
  const amountInWei = web3.utils.toWei(String(proposal.amount), "ether");
  const purpose = proposal.purpose;
  const fundSource = proposal.fundSource;
  const expenseType = proposal.expenseType;
  const proposer = proposal.proposer;
  const documentHash = proposal.documentHash;

  const tx = contract.methods.recordProposal(
    amountInWei,
    purpose,
    fundSource,
    expenseType,
    proposer,
    documentHash,
    treasurerAddress,
    chairmanAddress
  );
  return await safeSend(tx, chairmanAddress);
}
