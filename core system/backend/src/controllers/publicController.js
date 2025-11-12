import Web3 from "web3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Income from "../models/Income.js";
import Allocation from "../models/Allocation.js";
import Expenditure from "../models/Expenditure.js";
import Proposal from "../models/Proposal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract artifacts
const incomeContractPath = path.resolve(__dirname, "../../../../blockchain/build/contracts/IncomeContract.json");
const allocationContractPath = path.resolve(__dirname, "../../../../blockchain/build/contracts/AllocationContract.json");
const expenditureContractPath = path.resolve(__dirname, "../../../../blockchain/build/contracts/ExpenditureContract.json");
const proposalContractPath = path.resolve(__dirname, "../../../../blockchain/build/contracts/ProposalContract.json");

let IncomeArtifact = { abi: [], networks: {} };
let AllocationArtifact = { abi: [], networks: {} };
let ExpenditureArtifact = { abi: [], networks: {} };
let ProposalArtifact = { abi: [], networks: {} };

if (fs.existsSync(incomeContractPath)) {
  IncomeArtifact = JSON.parse(fs.readFileSync(incomeContractPath));
}
if (fs.existsSync(allocationContractPath)) {
  AllocationArtifact = JSON.parse(fs.readFileSync(allocationContractPath));
}
if (fs.existsSync(expenditureContractPath)) {
  ExpenditureArtifact = JSON.parse(fs.readFileSync(expenditureContractPath));
}
if (fs.existsSync(proposalContractPath)) {
  ProposalArtifact = JSON.parse(fs.readFileSync(proposalContractPath));
}

// Initialize web3
const web3 = new Web3(process.env.WEB3_PROVIDER || "http://127.0.0.1:7545");

/**
 * Get public blockchain data for transparency dashboard
 * No authentication required - this is public data
 */
export const getPublicBlockchainData = async (req, res) => {
  try {
    // Get contract addresses from network deployment
    const incomeNetworks = IncomeArtifact.networks || {};
    const incomeNetworkId = Object.keys(incomeNetworks)[0];
    const incomeAddress = incomeNetworkId ? incomeNetworks[incomeNetworkId].address : null;

    const allocationNetworks = AllocationArtifact.networks || {};
    const allocationNetworkId = Object.keys(allocationNetworks)[0];
    const allocationAddress = allocationNetworkId ? allocationNetworks[allocationNetworkId].address : null;

    const expenditureNetworks = ExpenditureArtifact.networks || {};
    const expenditureNetworkId = Object.keys(expenditureNetworks)[0];
    const expenditureAddress = expenditureNetworkId ? expenditureNetworks[expenditureNetworkId].address : null;

    const proposalNetworks = ProposalArtifact.networks || {};
    const proposalNetworkId = Object.keys(proposalNetworks)[0];
    const proposalAddress = proposalNetworkId ? proposalNetworks[proposalNetworkId].address : null;

    // Check if contracts are deployed
    if (!incomeAddress || !allocationAddress || !expenditureAddress || !proposalAddress) {
      return res.status(503).json({
        status: "error",
        message: "Smart contracts are not deployed. Please deploy the contracts first.",
        details: {
          incomeDeployed: !!incomeAddress,
          allocationDeployed: !!allocationAddress,
          expenditureDeployed: !!expenditureAddress,
          proposalDeployed: !!proposalAddress
        }
      });
    }

    // Initialize contract instances
    const incomeContract = new web3.eth.Contract(
      IncomeArtifact.abi,
      incomeAddress
    );

    const allocationContract = new web3.eth.Contract(
      AllocationArtifact.abi,
      allocationAddress
    );

    const expenditureContract = new web3.eth.Contract(
      ExpenditureArtifact.abi,
      expenditureAddress
    );

    const proposalContract = new web3.eth.Contract(
      ProposalArtifact.abi,
      proposalAddress
    );

    // Fetch transaction counts from blockchain and amounts from database
    const [
      incomeCount,
      allocationCount,
      expenditureCount,
      proposalCount,
      incomeRecords,
      allocationRecords,
      expenditureRecords,
      proposalRecords
    ] = await Promise.all([
      incomeContract.methods.incomeCount().call(),
      allocationContract.methods.allocationCount().call(),
      expenditureContract.methods.expenditureCount().call(),
      proposalContract.methods.proposalCount().call(),
      Income.find({ onChain: true }),  // Get only blockchain-verified income records
      Allocation.find({ status: "APPROVED" }),  // Get all approved allocations
      Expenditure.find({ status: "APPROVED" }),  // Get all approved expenditures
      Proposal.find({ status: "APPROVED" })  // Get all approved proposals
    ]);

    // Calculate totals from database (to avoid Wei conversion issues)
    const totalIncome = incomeRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
    const totalAllocations = allocationRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
    const totalExpenditures = expenditureRecords.reduce((sum, record) => sum + (record.amount || 0), 0);

    // Debug logging
    console.log(`📊 Database records count: Income=${incomeRecords.length}, Allocations=${allocationRecords.length}, Expenditures=${expenditureRecords.length}, Proposals=${proposalRecords.length}`);
    console.log(`💰 Totals: Income=PHP ${totalIncome}, Allocations=PHP ${totalAllocations}, Expenditures=PHP ${totalExpenditures}`);

    // Calculate available balance
    const availableBalance = totalIncome - totalAllocations - totalExpenditures;

    // Build income category breakdown from database amounts
    const incomeByCategory = {};
    incomeRecords.forEach(record => {
      const category = record.revenueSource || "Uncategorized";
      if (incomeByCategory[category]) {
        incomeByCategory[category] += record.amount || 0;
      } else {
        incomeByCategory[category] = record.amount || 0;
      }
    });

    // Fetch detailed income transaction data from blockchain, fallback to database
    const incomeList = [];
    for (let i = 0; i < incomeRecords.length; i++) {
      const dbRecord = incomeRecords[i];
      try {
        const income = await incomeContract.methods.getIncome(i).call();

        incomeList.push({
          id: income.id ? Number(income.id) : (dbRecord._id ? i + 1 : i),
          amount: dbRecord.amount || 0,
          revenueSource: income.revenueSource || dbRecord.revenueSource || "N/A",
          documentHash: income.documentHash || dbRecord.documentHash || "N/A",
          supportingDocument: dbRecord.supportingDocument || null,
          treasurerAddress: income.treasurerAddress || "N/A",
          timestamp: income.timestamp ? new Date(Number(income.timestamp) * 1000).toISOString() : (dbRecord.createdAt || new Date()).toISOString()
        });
      } catch (err) {
        console.error(`Error fetching income ${i} from blockchain, using database:`, err.message);
        // Fallback to database record
        incomeList.push({
          id: i + 1,
          amount: dbRecord.amount || 0,
          revenueSource: dbRecord.revenueSource || "N/A",
          documentHash: dbRecord.documentHash || "N/A",
          supportingDocument: dbRecord.supportingDocument || null,
          treasurerAddress: "N/A",
          timestamp: (dbRecord.createdAt || new Date()).toISOString()
        });
      }
    }

    // Build allocation category breakdown from database amounts
    const allocationByCategory = {};
    allocationRecords.forEach(record => {
      const category = record.purpose || "Uncategorized";
      if (allocationByCategory[category]) {
        allocationByCategory[category] += record.amount || 0;
      } else {
        allocationByCategory[category] = record.amount || 0;
      }
    });

    // Fetch detailed allocation transaction data from blockchain, fallback to database
    const allocationList = [];
    for (let i = 0; i < allocationRecords.length; i++) {
      const dbRecord = allocationRecords[i];
      try {
        const allocation = await allocationContract.methods.getAllocation(i).call();

        allocationList.push({
          id: allocation.id ? Number(allocation.id) : (dbRecord._id ? i + 1 : i),
          amount: dbRecord.amount || 0,
          allocationType: allocation.allocationType || dbRecord.purpose || "N/A",
          fundType: allocation.fundType || dbRecord.fundSource || "N/A",
          documentHash: allocation.documentHash || dbRecord.documentHash || "N/A",
          supportingDocument: dbRecord.supportingDocument || null,
          treasurerAddress: allocation.treasurerAddress || "N/A",
          chairmanAddress: allocation.chairmanAddress || "N/A",
          timestamp: allocation.timestamp ? new Date(Number(allocation.timestamp) * 1000).toISOString() : (dbRecord.createdAt || new Date()).toISOString()
        });
      } catch (err) {
        console.error(`Error fetching allocation ${i} from blockchain, using database:`, err.message);
        // Fallback to database record
        allocationList.push({
          id: i + 1,
          amount: dbRecord.amount || 0,
          allocationType: dbRecord.purpose || "N/A",
          fundType: dbRecord.fundSource || "N/A",
          documentHash: dbRecord.documentHash || "N/A",
          supportingDocument: dbRecord.supportingDocument || null,
          treasurerAddress: "N/A",
          chairmanAddress: "N/A",
          timestamp: (dbRecord.createdAt || new Date()).toISOString()
        });
      }
    }

    // Build expenditure category breakdown from database amounts
    const expenditureByCategory = {};
    expenditureRecords.forEach(record => {
      const category = record.fundSource || "Uncategorized";
      if (expenditureByCategory[category]) {
        expenditureByCategory[category] += record.amount || 0;
      } else {
        expenditureByCategory[category] = record.amount || 0;
      }
    });

    // Fetch detailed expenditure transaction data from blockchain, fallback to database
    const expenditureList = [];
    for (let i = 0; i < expenditureRecords.length; i++) {
      const dbRecord = expenditureRecords[i];
      try {
        const expenditure = await expenditureContract.methods.getExpenditure(i).call();

        expenditureList.push({
          id: expenditure.id ? Number(expenditure.id) : (dbRecord._id ? i + 1 : i),
          amount: dbRecord.amount || 0,
          purpose: expenditure.purpose || dbRecord.purpose || "N/A",
          fundSource: expenditure.fundSource || dbRecord.fundSource || "N/A",
          documentHash: expenditure.documentHash || dbRecord.documentHash || "N/A",
          supportingDocument: dbRecord.supportingDocument || null,
          proposalId: expenditure.proposalId ? Number(expenditure.proposalId) : (dbRecord.proposalId || null),
          treasurerAddress: expenditure.treasurerAddress || "N/A",
          chairmanAddress: expenditure.chairmanAddress || "N/A",
          timestamp: expenditure.timestamp ? new Date(Number(expenditure.timestamp) * 1000).toISOString() : (dbRecord.createdAt || new Date()).toISOString()
        });
      } catch (err) {
        console.error(`Error fetching expenditure ${i} from blockchain, using database:`, err.message);
        // Fallback to database record
        expenditureList.push({
          id: i + 1,
          amount: dbRecord.amount || 0,
          purpose: dbRecord.purpose || "N/A",
          fundSource: dbRecord.fundSource || "N/A",
          documentHash: dbRecord.documentHash || "N/A",
          supportingDocument: dbRecord.supportingDocument || null,
          proposalId: dbRecord.proposalId || null,
          treasurerAddress: "N/A",
          chairmanAddress: "N/A",
          timestamp: (dbRecord.createdAt || new Date()).toISOString()
        });
      }
    }

    // Fetch proposal transaction data from blockchain, fallback to database
    const proposalList = [];
    for (let i = 0; i < proposalRecords.length; i++) {
      const dbRecord = proposalRecords[i];
      try {
        const proposal = await proposalContract.methods.getProposal(i).call();

        proposalList.push({
          id: proposal.id ? Number(proposal.id) : (dbRecord._id ? i + 1 : i),
          amount: dbRecord.amount || 0,
          purpose: proposal.purpose || dbRecord.purpose || "N/A",
          fundSource: proposal.fundSource || dbRecord.fundSource || "N/A",
          expenseType: proposal.expenseType || dbRecord.expenseType || "N/A",
          proposer: proposal.proposer || dbRecord.proposer || "N/A",
          documentHash: proposal.documentHash || dbRecord.documentHash || "N/A",
          supportingDocument: dbRecord.supportingDocument || null,
          treasurerAddress: proposal.treasurerAddress || "N/A",
          chairmanAddress: proposal.chairmanAddress || "N/A",
          timestamp: proposal.timestamp ? new Date(Number(proposal.timestamp) * 1000).toISOString() : (dbRecord.createdAt || new Date()).toISOString()
        });
      } catch (err) {
        console.error(`Error fetching proposal ${i} from blockchain, using database:`, err.message);
        // Fallback to database record
        proposalList.push({
          id: i + 1,
          amount: dbRecord.amount || 0,
          purpose: dbRecord.purpose || "N/A",
          fundSource: dbRecord.fundSource || "N/A",
          expenseType: dbRecord.expenseType || "N/A",
          proposer: dbRecord.proposer || "N/A",
          documentHash: dbRecord.documentHash || "N/A",
          supportingDocument: dbRecord.supportingDocument || null,
          treasurerAddress: "N/A",
          chairmanAddress: "N/A",
          timestamp: (dbRecord.createdAt || new Date()).toISOString()
        });
      }
    }

    // Proposal statistics - all proposals on blockchain are approved
    const approvedProposals = Number(proposalCount);
    const pendingProposals = 0;
    const rejectedProposals = 0;

    // Return structured data
    return res.json({
      status: "success",
      message: "Public blockchain data retrieved successfully",
      data: {
        // Summary totals
        totalIncome,
        totalAllocations,
        totalExpenditures,
        availableBalance,

        // Transaction counts
        counts: {
          income: Number(incomeCount),
          allocations: Number(allocationCount),
          expenditures: Number(expenditureCount),
          proposals: Number(proposalCount),
        },

        // Proposal statistics
        proposals: {
          total: Number(proposalCount),
          approved: approvedProposals,
          pending: pendingProposals,
          rejected: rejectedProposals,
        },

        // Category breakdowns
        categories: {
          income: incomeByCategory,
          allocations: allocationByCategory,
          expenditures: expenditureByCategory,
        },

        // Transaction history lists
        transactions: {
          income: incomeList,
          allocations: allocationList,
          expenditures: expenditureList,
          proposals: proposalList,
        },

        // Timestamp
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error fetching public blockchain data:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch blockchain data",
      error: err.message,
    });
  }
};
