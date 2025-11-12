import Web3 from "web3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractPath = path.resolve(__dirname, "../../../../blockchain/build/contracts/IncomeContract.json");

let IncomeArtifact = { abi: [], networks: {} };
if (fs.existsSync(contractPath)) {
  IncomeArtifact = JSON.parse(fs.readFileSync(contractPath));
} else {
  console.warn("⚠️ IncomeContract.json not found at:", contractPath);
}

const web3 = new Web3(process.env.WEB3_PROVIDER || "http://127.0.0.1:7545");
const networks = IncomeArtifact.networks || {};
const firstNetwork = Object.keys(networks)[0];
const address = firstNetwork ? networks[firstNetwork].address : null;

if (!address) console.warn("⚠️ IncomeContract not deployed or address missing.");

const contract = address ? new web3.eth.Contract(IncomeArtifact.abi, address) : null;

async function safeSend(tx, from) {
  try {
    const gas = await tx.estimateGas({ from });
    const gasLimit = Math.min(Number(gas) + 100000, 6000000);
    const receipt = await tx.send({ from, gas: gasLimit });
    return { txHash: receipt?.transactionHash || null, onChain: true };
  } catch (err) {
    console.warn("⚠️ Blockchain transaction failed (Income):", err.message);
    return { txHash: null, onChain: false };
  }
}

export async function recordIncomeOnChain({ amount, revenueSource, documentHash, treasurerAddress }) {
  if (!contract) return { txHash: null, onChain: false };

  // Validate required fields
  if (!amount || amount <= 0) {
    console.warn("⚠️ Invalid income amount");
    return { txHash: null, onChain: false };
  }
  if (!revenueSource) {
    console.warn("⚠️ Revenue source is required");
    return { txHash: null, onChain: false };
  }
  if (!documentHash) {
    console.warn("⚠️ Document hash is required for blockchain recording");
    return { txHash: null, onChain: false };
  }

  // Convert PHP to Wei (1 PHP = 1 ETH = 10^18 Wei)
  const amountInWei = web3.utils.toWei(String(amount), "ether");

  const tx = contract.methods.recordIncome(
    amountInWei,
    revenueSource,
    documentHash,
    treasurerAddress
  );
  return await safeSend(tx, treasurerAddress);
}
