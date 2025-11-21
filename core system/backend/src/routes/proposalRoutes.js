import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireActiveOfficial, requireRole } from "../middlewares/officialAccess.js";
import { submitProposal, approveProposal, rejectProposal, getAllProposals, getProposalFundSources, getCategoryBudgets } from "../controllers/proposalController.js";

const router = express.Router();

// Get valid proposal fund sources (accessible to all authenticated officials)
router.get(
  "/fund-sources",
  requireAuth,
  requireActiveOfficial,
  getProposalFundSources
);

// Get category budgets (accessible to all authenticated officials)
router.get(
  "/category-budgets",
  requireAuth,
  requireActiveOfficial,
  getCategoryBudgets
);

// Get all proposals (accessible to all authenticated officials)
router.get(
  "/",
  requireAuth,
  requireActiveOfficial,
  getAllProposals
);

// Treasurer can submit
router.post(
  "/",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Treasurer"]),
  submitProposal
);

// Chairman can approve
router.patch(
  "/:id/approve",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Chairman"]),
  approveProposal
);

// Chairman can reject
router.patch(
  "/:id/reject",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Chairman"]),
  rejectProposal
);

export default router;
