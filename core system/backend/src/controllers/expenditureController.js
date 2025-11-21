import Expenditure, { EXPENDITURE_FUND_SOURCES } from "../models/Expenditure.js";
import Income from "../models/Income.js";
import Allocation from "../models/Allocation.js";
import Proposal from "../models/Proposal.js";
import { approveExpenditureOnChain } from "../services/expenditureChainService.js";
import crypto from "crypto";

// Helper function to calculate available balance
const calculateAvailableBalance = async () => {
  const incomes = await Income.find({ onChain: true });
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  const allocations = await Allocation.find({ status: "APPROVED" });
  const totalAllocations = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

  const expenditures = await Expenditure.find({ status: "APPROVED" });
  const totalExpenditures = expenditures.reduce((sum, exp) => sum + exp.amount, 0);

  const proposals = await Proposal.find({ status: "APPROVED" });
  const totalProposals = proposals.reduce((sum, prop) => sum + prop.amount, 0);

  return {
    generalFund: totalIncome,
    totalIncome,
    totalAllocations,
    totalExpenditures,
    totalProposals,
    availableBalance: totalIncome - totalAllocations // Unallocated General Fund
  };
};

export const submitExpenditure = async (req, res) => {
  try {
    const { proposalId, supportingDocument } = req.body;

    // Validate required fields
    if (!proposalId || !supportingDocument) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: proposalId, supportingDocument"
      });
    }

    // Verify that the proposal exists and is approved
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        status: "error",
        message: "Proposal not found. Please select a valid proposal."
      });
    }
    if (proposal.status !== "APPROVED") {
      return res.status(400).json({
        status: "error",
        message: "Can only create expenditure for APPROVED proposals. This proposal is currently " + proposal.status
      });
    }

    // Check if expenditure already exists for this proposal
    const existingExpenditure = await Expenditure.findOne({
      proposalId,
      status: { $in: ["PROPOSED", "APPROVED"] }
    });
    if (existingExpenditure) {
      return res.status(400).json({
        status: "error",
        message: "An expenditure record already exists for this proposal."
      });
    }

    // Create expenditure with data automatically pulled from the proposal
    const expenditure = await Expenditure.create({
      amount: proposal.amount,
      purpose: proposal.purpose,
      fundSource: proposal.fundSource,
      proposalId,
      supportingDocument,
      status: "PROPOSED",
      createdBy: req.user._id,
      createdByRole: req.user.role,
      onChain: false,
    });

    return res.status(201).json({
      status: "success",
      message: "Expenditure submitted successfully",
      data: expenditure,
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const approveExpenditure = async (req, res) => {
  try {
    const { id } = req.params;
    const expenditure = await Expenditure.findById(id).populate('createdBy', 'walletAddress fullName role termStart termEnd isActive');
    if (!expenditure) return res.status(404).json({ status: "error", message: "Expenditure not found" });
    if (expenditure.status !== "PROPOSED")
      return res.status(400).json({ status: "error", message: "Can only approve PROPOSED expenditures" });

    // Generate document hash from expenditure data
    const documentData = JSON.stringify({
      amount: expenditure.amount,
      purpose: expenditure.purpose,
      fundSource: expenditure.fundSource,
      proposalId: expenditure.proposalId,
      supportingDocument: expenditure.supportingDocument,
      createdBy: expenditure.createdBy._id,
      termStart: expenditure.createdBy.termStart,
      termEnd: expenditure.createdBy.termEnd,
      createdAt: expenditure.createdAt,
      approvedBy: req.user._id,
      approvedAt: new Date()
    });
    const documentHash = crypto.createHash('sha256').update(documentData).digest('hex');

    // Get treasurer's wallet address from the expenditure creator
    const treasurerAddress = expenditure.createdBy?.walletAddress;
    const chairmanAddress = req.user.walletAddress;

    // Record on blockchain with the generated hash
    expenditure.documentHash = documentHash;
    const chain = await approveExpenditureOnChain({
      expenditure,
      treasurerAddress,
      chairmanAddress
    });

    expenditure.status = "APPROVED";
    expenditure.approvedBy = req.user._id;
    expenditure.approvedAt = new Date();
    expenditure.txHash = chain?.txHash || expenditure.txHash;
    expenditure.onChain = chain?.onChain || expenditure.onChain;
    await expenditure.save();

    // Construct clean response without sensitive data
    const responseData = {
      _id: expenditure._id,
      amount: expenditure.amount,
      purpose: expenditure.purpose,
      fundSource: expenditure.fundSource,
      proposalId: expenditure.proposalId,
      supportingDocument: expenditure.supportingDocument,
      documentHash: expenditure.documentHash,
      status: expenditure.status,
      createdBy: {
        _id: expenditure.createdBy._id,
        fullName: expenditure.createdBy.fullName,
        role: expenditure.createdBy.role,
        walletAddress: expenditure.createdBy.walletAddress,
        termStart: expenditure.createdBy.termStart,
        termEnd: expenditure.createdBy.termEnd,
        isActive: expenditure.createdBy.isActive
      },
      createdByRole: expenditure.createdByRole,
      createdAt: expenditure.createdAt,
      approvedBy: expenditure.approvedBy,
      approvedAt: expenditure.approvedAt,
      txHash: expenditure.txHash,
      onChain: expenditure.onChain
    };

    return res.json({ status: "success", message: "Expenditure approved", data: responseData });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const rejectExpenditure = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const expenditure = await Expenditure.findById(id);
    if (!expenditure) return res.status(404).json({ status: "error", message: "Expenditure not found" });
    if (expenditure.status !== "PROPOSED")
      return res.status(400).json({ status: "error", message: "Can only reject PROPOSED expenditures" });

    expenditure.status = "REJECTED";
    expenditure.rejectionReason = rejectionReason;
    expenditure.rejectedBy = req.user._id;
    expenditure.rejectedAt = new Date();
    await expenditure.save();

    return res.json({ status: "success", message: "Expenditure rejected", data: expenditure });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getAllExpenditures = async (req, res) => {
  try {
    // Fetch expenditures based on user role
    let query = {};

    // Chairman sees all expenditures, Treasurer sees their own submissions
    if (req.user.role === "Chairman") {
      query = {}; // Can see all
    } else if (req.user.role === "Treasurer") {
      query = { createdBy: req.user._id };
    }

    const expenditures = await Expenditure.find(query)
      .populate('createdBy', 'fullName role walletAddress')
      .populate('approvedBy', 'fullName role')
      .populate('rejectedBy', 'fullName role')
      .sort({ createdAt: -1 }); // Most recent first

    return res.json({
      status: "success",
      message: "Expenditures retrieved successfully",
      data: expenditures
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getExpenditureFundSources = async (req, res) => {
  try {
    return res.json({
      status: "success",
      message: "Valid expenditure fund sources retrieved",
      data: EXPENDITURE_FUND_SOURCES
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};
