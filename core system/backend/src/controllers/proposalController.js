import Proposal, { PROPOSAL_FUND_SOURCES } from "../models/Proposal.js";
import Income from "../models/Income.js";
import Allocation from "../models/Allocation.js";
import Expenditure from "../models/Expenditure.js";
import { approveProposalOnChain } from "../services/proposalChainService.js";
import crypto from "crypto";

// Helper function to calculate available balance per fund category
const calculateCategoryBudgets = async () => {
  // Get total income (General Fund)
  const incomes = await Income.find({ onChain: true });
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  // Get approved allocations grouped by category (purpose)
  const allocations = await Allocation.find({ status: "APPROVED" });
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

  // Calculate allocated amount per category
  const categoryAllocations = {};
  allocations.forEach(alloc => {
    if (!categoryAllocations[alloc.purpose]) {
      categoryAllocations[alloc.purpose] = 0;
    }
    categoryAllocations[alloc.purpose] += alloc.amount;
  });

  // Get approved proposals grouped by fund source
  const proposals = await Proposal.find({ status: "APPROVED" });
  const categoryProposals = {};
  proposals.forEach(prop => {
    if (!categoryProposals[prop.fundSource]) {
      categoryProposals[prop.fundSource] = 0;
    }
    categoryProposals[prop.fundSource] += prop.amount;
  });

  // Calculate remaining budget per category
  const categoryBudgets = {};
  Object.keys(categoryAllocations).forEach(category => {
    const allocated = categoryAllocations[category] || 0;
    const spent = categoryProposals[category] || 0;
    categoryBudgets[category] = {
      allocated,
      spent,
      remaining: allocated - spent
    };
  });

  // Calculate unallocated general fund
  const unallocatedGeneralFund = totalIncome - totalAllocated;

  return {
    totalIncome,
    totalAllocated,
    unallocatedGeneralFund,
    categoryBudgets
  };
};

export const submitProposal = async (req, res) => {
  try {
    const { amount, purpose, fundSource, expenseType, proposer, supportingDocument } = req.body;

    // Validate required fields
    if (!amount || !purpose || !fundSource || !expenseType || !proposer || !supportingDocument) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: amount, purpose, fundSource, expenseType, proposer, supportingDocument"
      });
    }

    // Check category-specific budget
    const budgetInfo = await calculateCategoryBudgets();

    if (budgetInfo.totalIncome === 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot create proposal: No income has been recorded yet. Please record income first."
      });
    }

    // Check if the fund category has been allocated
    const categoryBudget = budgetInfo.categoryBudgets[fundSource];
    if (!categoryBudget) {
      return res.status(400).json({
        status: "error",
        message: `No budget allocated for "${fundSource}". Please create an allocation for this fund category first.`
      });
    }

    // Check if there's sufficient budget in this category
    if (categoryBudget.remaining < Number(amount)) {
      return res.status(400).json({
        status: "error",
        message: `Insufficient budget. Available: PHP ${(Number(categoryBudget.remaining) || 0).toFixed(2)}, Requested: PHP ${(Number(amount) || 0).toFixed(2)}`
      });
    }

    const proposal = await Proposal.create({
      amount,
      purpose,
      fundSource,
      expenseType,
      proposer,
      supportingDocument,
      status: "PROPOSED",
      createdBy: req.user._id,
      createdByRole: req.user.role,
      onChain: false,
    });

    return res.status(201).json({
      status: "success",
      message: "Proposal submitted",
      data: proposal,
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const approveProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await Proposal.findById(id).populate('createdBy', 'walletAddress fullName role termStart termEnd isActive');
    if (!proposal) return res.status(404).json({ status: "error", message: "Not found" });
    if (proposal.status !== "PROPOSED")
      return res.status(400).json({ status: "error", message: "Can only approve PROPOSED" });

    // Generate document hash from proposal data
    const documentData = JSON.stringify({
      amount: proposal.amount,
      purpose: proposal.purpose,
      fundSource: proposal.fundSource,
      expenseType: proposal.expenseType,
      proposer: proposal.proposer,
      supportingDocument: proposal.supportingDocument,
      createdBy: proposal.createdBy._id,
      termStart: proposal.createdBy.termStart,
      termEnd: proposal.createdBy.termEnd,
      createdAt: proposal.createdAt,
      approvedBy: req.user._id,
      approvedAt: new Date()
    });
    const documentHash = crypto.createHash('sha256').update(documentData).digest('hex');

    // Get treasurer's wallet address from the proposal creator
    const treasurerAddress = proposal.createdBy?.walletAddress;
    const chairmanAddress = req.user.walletAddress;

    // Record on blockchain with the generated hash
    proposal.documentHash = documentHash;
    const chain = await approveProposalOnChain({
      proposal,
      treasurerAddress,
      chairmanAddress
    });

    proposal.status = "APPROVED";
    proposal.approvedBy = req.user._id;
    proposal.approvedAt = new Date();
    proposal.txHash = chain?.txHash || proposal.txHash;
    proposal.onChain = chain?.onChain || proposal.onChain;
    await proposal.save();

    // Construct clean response without sensitive data
    const responseData = {
      _id: proposal._id,
      amount: proposal.amount,
      purpose: proposal.purpose,
      fundSource: proposal.fundSource,
      expenseType: proposal.expenseType,
      proposer: proposal.proposer,
      supportingDocument: proposal.supportingDocument,
      documentHash: proposal.documentHash,
      status: proposal.status,
      createdBy: {
        _id: proposal.createdBy._id,
        fullName: proposal.createdBy.fullName,
        role: proposal.createdBy.role,
        walletAddress: proposal.createdBy.walletAddress,
        termStart: proposal.createdBy.termStart,
        termEnd: proposal.createdBy.termEnd,
        isActive: proposal.createdBy.isActive
      },
      createdByRole: proposal.createdByRole,
      createdAt: proposal.createdAt,
      approvedBy: proposal.approvedBy,
      approvedAt: proposal.approvedAt,
      txHash: proposal.txHash,
      onChain: proposal.onChain
    };

    return res.json({ status: "success", message: "Proposal approved", data: responseData });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const rejectProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const proposal = await Proposal.findById(id);
    if (!proposal) return res.status(404).json({ status: "error", message: "Not found" });
    if (proposal.status !== "PROPOSED")
      return res.status(400).json({ status: "error", message: "Can only reject PROPOSED" });

    proposal.status = "REJECTED";
    proposal.rejectionReason = rejectionReason;
    proposal.rejectedBy = req.user._id;
    proposal.rejectedAt = new Date();
    await proposal.save();

    return res.json({ status: "success", message: "Proposal rejected", data: proposal });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getAllProposals = async (req, res) => {
  try {
    // Fetch proposals based on user role
    let query = {};

    // Chairman sees all proposals, Treasurer sees their own submissions
    if (req.user.role === "Chairman") {
      query = {}; // Can see all
    } else if (req.user.role === "Treasurer") {
      query = { createdBy: req.user._id };
    }

    const proposals = await Proposal.find(query)
      .populate('createdBy', 'fullName role walletAddress')
      .populate('approvedBy', 'fullName role')
      .populate('rejectedBy', 'fullName role')
      .sort({ createdAt: -1 }); // Most recent first

    return res.json({
      status: "success",
      message: "Proposals retrieved successfully",
      data: proposals
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getProposalFundSources = async (req, res) => {
  try {
    return res.json({
      status: "success",
      message: "Valid proposal fund sources retrieved",
      data: PROPOSAL_FUND_SOURCES
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getCategoryBudgets = async (req, res) => {
  try {
    const budgetInfo = await calculateCategoryBudgets();
    return res.json({
      status: "success",
      message: "Category budgets retrieved successfully",
      data: budgetInfo
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};
