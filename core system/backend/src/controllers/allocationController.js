import Allocation, { ALLOCATION_TYPES } from "../models/Allocation.js";
import Income from "../models/Income.js";
import Expenditure from "../models/Expenditure.js";
import Proposal from "../models/Proposal.js";
import { submitAllocationOnChain, approveAllocationOnChain } from "../services/allocationChainService.js";
import crypto from "crypto";

// Helper function to calculate available balance
const calculateAvailableBalance = async () => {
  // Get total income
  const incomes = await Income.find({ onChain: true }); // Only count blockchain-verified income
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  // Get total approved allocations
  const allocations = await Allocation.find({ status: "APPROVED" });
  const totalAllocations = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

  // Get total approved expenditures
  const expenditures = await Expenditure.find({ status: "APPROVED" });
  const totalExpenditures = expenditures.reduce((sum, exp) => sum + exp.amount, 0);

  // Get total approved proposals
  const proposals = await Proposal.find({ status: "APPROVED" });
  const totalProposals = proposals.reduce((sum, prop) => sum + prop.amount, 0);

  return {
    generalFund: totalIncome, // Total recorded income = General Fund
    totalIncome,
    totalAllocations,
    totalExpenditures,
    totalProposals,
    availableBalance: totalIncome - totalAllocations - totalExpenditures - totalProposals
  };
};

export const submitAllocation = async (req, res) => {
  try {
    const { amount, purpose, fundSource, supportingDocument } = req.body;

    // Validate required fields
    if (!amount || !purpose || !fundSource || !supportingDocument) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: amount, purpose, fundSource, supportingDocument"
      });
    }

    // Check if there's sufficient income
    const balanceInfo = await calculateAvailableBalance();
    if (balanceInfo.totalIncome === 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot create allocation: No income has been recorded yet. Please record income first."
      });
    }

    if (balanceInfo.availableBalance < amount) {
      return res.status(400).json({
        status: "error",
        message: `Insufficient balance. Available: PHP ${balanceInfo.availableBalance.toFixed(2)}, Requested: PHP ${amount}`
      });
    }

    const allocation = await Allocation.create({
      amount,
      purpose,
      fundSource,
      supportingDocument,
      status: "PROPOSED",
      createdBy: req.user._id,
      createdByRole: req.user.role,
      onChain: false,
    });

    return res.status(201).json({
      status: "success",
      message: "Allocation submitted",
      data: allocation,
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const approveAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const allocation = await Allocation.findById(id).populate('createdBy', 'walletAddress fullName role termStart termEnd isActive');
    if (!allocation) return res.status(404).json({ status: "error", message: "Not found" });
    if (allocation.status !== "PROPOSED")
      return res.status(400).json({ status: "error", message: "Can only approve PROPOSED" });

    // Generate document hash from allocation data
    const documentData = JSON.stringify({
      amount: allocation.amount,
      purpose: allocation.purpose,
      fundSource: allocation.fundSource,
      supportingDocument: allocation.supportingDocument,
      createdBy: allocation.createdBy._id,
      termStart: allocation.createdBy.termStart,
      termEnd: allocation.createdBy.termEnd,
      createdAt: allocation.createdAt,
      approvedBy: req.user._id,
      approvedAt: new Date()
    });
    const documentHash = crypto.createHash('sha256').update(documentData).digest('hex');

    // Get treasurer's wallet address from the allocation creator
    const treasurerAddress = allocation.createdBy?.walletAddress;
    const chairmanAddress = req.user.walletAddress;

    // Record on blockchain with the generated hash
    allocation.documentHash = documentHash;
    const chain = await approveAllocationOnChain({
      allocation,
      treasurerAddress,
      chairmanAddress
    });

    allocation.status = "APPROVED";
    allocation.approvedBy = req.user._id;
    allocation.approvedAt = new Date();
    allocation.txHash = chain?.txHash || allocation.txHash;
    allocation.onChain = chain?.onChain || allocation.onChain;
    await allocation.save();

    // Construct clean response without sensitive data
    const responseData = {
      _id: allocation._id,
      amount: allocation.amount,
      purpose: allocation.purpose,
      fundSource: allocation.fundSource,
      supportingDocument: allocation.supportingDocument,
      documentHash: allocation.documentHash,
      status: allocation.status,
      createdBy: {
        _id: allocation.createdBy._id,
        fullName: allocation.createdBy.fullName,
        role: allocation.createdBy.role,
        walletAddress: allocation.createdBy.walletAddress,
        termStart: allocation.createdBy.termStart,
        termEnd: allocation.createdBy.termEnd,
        isActive: allocation.createdBy.isActive
      },
      createdByRole: allocation.createdByRole,
      createdAt: allocation.createdAt,
      approvedBy: allocation.approvedBy,
      approvedAt: allocation.approvedAt,
      txHash: allocation.txHash,
      onChain: allocation.onChain
    };

    return res.json({ status: "success", message: "Allocation approved", data: responseData });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const rejectAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    console.log('Rejection request received:', { id, rejectionReason, body: req.body });

    const allocation = await Allocation.findById(id);
    if (!allocation) return res.status(404).json({ status: "error", message: "Not found" });
    if (allocation.status !== "PROPOSED")
      return res.status(400).json({ status: "error", message: "Can only reject PROPOSED" });

    allocation.status = "REJECTED";
    allocation.rejectionReason = rejectionReason;
    allocation.rejectedBy = req.user._id;
    allocation.rejectedAt = new Date();
    await allocation.save();

    console.log('Allocation rejected successfully:', { rejectionReason: allocation.rejectionReason });

    return res.json({ status: "success", message: "Allocation rejected", data: allocation });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getAllAllocations = async (req, res) => {
  try {
    // Fetch allocations based on user role
    let query = {};

    // Chairman sees pending allocations, Treasurer sees their own submissions
    if (req.user.role === "Chairman") {
      // Chairman can see all allocations, especially PROPOSED ones
      query = {}; // Can see all
    } else if (req.user.role === "Treasurer") {
      // Treasurer sees their own submissions
      query = { createdBy: req.user._id };
    }

    const allocations = await Allocation.find(query)
      .populate('createdBy', 'fullName role walletAddress')
      .populate('approvedBy', 'fullName role')
      .populate('rejectedBy', 'fullName role')
      .sort({ createdAt: -1 }); // Most recent first

    return res.json({
      status: "success",
      message: "Allocations retrieved successfully",
      data: allocations
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getAllocationTypes = async (req, res) => {
  try {
    return res.json({
      status: "success",
      message: "Valid allocation types retrieved",
      data: ALLOCATION_TYPES
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getGeneralFund = async (req, res) => {
  try {
    const balanceInfo = await calculateAvailableBalance();
    return res.json({
      status: "success",
      message: "General fund information retrieved",
      data: {
        generalFund: balanceInfo.generalFund,
        totalAllocations: balanceInfo.totalAllocations,
        totalExpenditures: balanceInfo.totalExpenditures,
        totalProposals: balanceInfo.totalProposals,
        availableBalance: balanceInfo.availableBalance
      }
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};
