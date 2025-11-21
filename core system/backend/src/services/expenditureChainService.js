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

  // Get the blockchain proposal ID
  let proposalIdNumber = 0;
  if (expenditure.proposalId) {
    try {
      // Import Proposal model and ProposalContract to fetch blockchain ID
      const Proposal = (await import('../models/Proposal.js')).default;
      const { getContract } = await import('./proposalChainService.js');

      const proposal = await Proposal.findById(expenditure.proposalId);
      const proposalContract = getContract();

      console.log(`🔍 Looking up blockchain proposal ID for database proposal ${expenditure.proposalId}`);
      console.log(`📄 Proposal found in DB: ${!!proposal}, onChain: ${proposal?.onChain}, documentHash: ${proposal?.documentHash}`);

      if (proposal && proposal.onChain && proposalContract) {
        // Find the blockchain proposal ID by searching through proposals
        const proposalCount = await proposalContract.methods.proposalCount().call();
        console.log(`📊 Total blockchain proposals: ${proposalCount}`);

        for (let i = 1; i <= proposalCount; i++) {
          const blockchainProposal = await proposalContract.methods.getProposal(i).call();
          // Match by comparing document hash (unique identifier)
          if (blockchainProposal.documentHash === proposal.documentHash) {
            proposalIdNumber = Number(blockchainProposal.id);
            console.log(`✅ Found blockchain proposal ID ${proposalIdNumber} for database proposal ${expenditure.proposalId}`);
            break;
          }
        }

        if (proposalIdNumber === 0) {
          console.warn(`⚠️ No matching blockchain proposal found for database proposal ${expenditure.proposalId} with hash ${proposal.documentHash}`);
        }
      } else {
        console.warn(`⚠️ Proposal not ready: proposal=${!!proposal}, onChain=${proposal?.onChain}, contract=${!!proposalContract}`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not fetch blockchain proposal ID: ${err.message}`);
      proposalIdNumber = 0;
    }
  } else {
    console.log(`ℹ️ No proposal ID linked to this expenditure`);
  }

  const tx = contract.methods.recordExpenditure(
    amountInWei,
    purpose,
    fundSource,
    documentHash,
    proposalIdNumber,
    treasurerAddress,
    chairmanAddress
  );
  return await safeSend(tx, chairmanAddress);
}
