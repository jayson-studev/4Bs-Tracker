import Web3 from "web3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractPath = path.resolve(__dirname, "../../../../blockchain/build/contracts/BarangayOfficials.json");

let OfficialsArtifact = { abi: [], networks: {} };
if (fs.existsSync(contractPath)) {
  OfficialsArtifact = JSON.parse(fs.readFileSync(contractPath));
} else {
  console.warn("⚠️ BarangayOfficials.json not found at:", contractPath);
}

const web3 = new Web3(process.env.WEB3_PROVIDER || "http://127.0.0.1:7545");

const networks = OfficialsArtifact.networks || {};
const firstNetwork = Object.keys(networks)[0];
const address = firstNetwork ? networks[firstNetwork].address : null;

if (!address)
  console.warn("⚠️ BarangayOfficials contract not deployed or address missing.");

const contract = address
  ? new web3.eth.Contract(OfficialsArtifact.abi, address)
  : null;

async function safeSend(tx, from) {
  try {
    const gas = await tx.estimateGas({ from });
    const gasLimit = Math.min(Number(gas) + 100000, 6000000);
    const receipt = await tx.send({ from, gas: gasLimit });
    return { txHash: receipt?.transactionHash || null, onChain: true };
  } catch (err) {
    console.warn("⚠️ Blockchain transaction failed (Officials):", err.message);
    return { txHash: null, onChain: false };
  }
}

/**
 * Register an official on the blockchain
 * @param {Object} officialData - Contains name, email, role, walletAddress, termStart, termEnd
 * @param {string} from - Admin (Chairman) wallet address
 */
export async function registerOfficialOnChain({ name, email, role, walletAddress, termStart, termEnd, from }) {
  if (!contract) return { txHash: null, onChain: false };

  try {
    // Convert dates to Unix timestamps
    const termStartTimestamp = termStart ? Math.floor(new Date(termStart).getTime() / 1000) : Math.floor(Date.now() / 1000);
    const termEndTimestamp = termEnd ? Math.floor(new Date(termEnd).getTime() / 1000) : 0;

    const tx = contract.methods.registerOfficial(
      walletAddress,
      name || "Unknown",
      email || "",
      role || "Official",
      termStartTimestamp,
      termEndTimestamp
    );
    return await safeSend(tx, from);
  } catch (err) {
    console.warn("⚠️ registerOfficialOnChain failed:", err.message);
    return { txHash: null, onChain: false };
  }
}

/**
 * Deactivate (end term) of an official on-chain
 * @param {string} walletAddress - The official's wallet address to deactivate
 * @param {string} reason - Reason for deactivation (e.g., "Term ended", "Resigned")
 * @param {string} from - The chairman's wallet address performing the deactivation
 */
export async function deactivateOfficialOnChain({ walletAddress, reason, from }) {
  if (!contract) return { txHash: null, onChain: false };

  try {
    const tx = contract.methods.deactivateOfficial(walletAddress, reason || "Deactivated by system");
    return await safeSend(tx, from);
  } catch (err) {
    console.warn("⚠️ deactivateOfficialOnChain failed:", err.message);
    return { txHash: null, onChain: false };
  }
}

/**
 * Get active officials from blockchain
 */
export async function getActiveOfficialsOnChain() {
  if (!contract) return [];

  try {
    const officials = await contract.methods.getActiveOfficials().call();
    return officials;
  } catch (err) {
    console.warn("⚠️ getActiveOfficialsOnChain failed:", err.message);
    return [];
  }
}
