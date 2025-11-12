import Income, { REVENUE_SOURCES } from "../models/Income.js";
import { recordIncomeOnChain } from "../services/incomeChainService.js";
import crypto from "crypto";

export const recordIncome = async (req, res) => {
  try {
    const { amount, revenueSource, supportingDocument } = req.body;

    // Validate required fields
    if (!amount || !revenueSource || !supportingDocument) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: amount, revenueSource, supportingDocument"
      });
    }

    // Generate document hash immediately (income doesn't need approval)
    const documentData = JSON.stringify({
      amount,
      revenueSource,
      supportingDocument,
      recordedBy: req.user._id,
      recordedAt: new Date()
    });
    const documentHash = crypto.createHash('sha256').update(documentData).digest('hex');

    // Record on blockchain immediately
    const chain = await recordIncomeOnChain({
      amount,
      revenueSource,
      documentHash,
      treasurerAddress: req.user.walletAddress
    });

    const income = await Income.create({
      amount,
      revenueSource,
      supportingDocument,
      documentHash,
      recordedBy: req.user._id,
      recordedByRole: req.user.role,
      txHash: chain?.txHash || null,
      onChain: chain?.onChain || false,
    });

    return res.status(201).json({
      status: "success",
      message: "Income recorded successfully",
      data: income,
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getAllIncome = async (req, res) => {
  try {
    // Fetch all income records, populated with recordedBy user info
    const incomes = await Income.find()
      .populate('recordedBy', 'fullName role walletAddress')
      .sort({ createdAt: -1 }); // Most recent first

    return res.json({
      status: "success",
      message: "Income records retrieved successfully",
      data: incomes
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};

export const getRevenueSourceTypes = async (req, res) => {
  try {
    return res.json({
      status: "success",
      message: "Valid revenue source types retrieved",
      data: REVENUE_SOURCES
    });
  } catch (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};
