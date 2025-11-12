import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireActiveOfficial, requireRole } from "../middlewares/officialAccess.js";
import { submitExpenditure, approveExpenditure, rejectExpenditure, getAllExpenditures, getExpenditureFundSources } from "../controllers/expenditureController.js";

const router = express.Router();

// Get valid expenditure fund sources (accessible to all authenticated officials)
router.get(
  "/fund-sources",
  requireAuth,
  requireActiveOfficial,
  getExpenditureFundSources
);

// Get all expenditures (accessible to all authenticated officials)
router.get(
  "/",
  requireAuth,
  requireActiveOfficial,
  getAllExpenditures
);

// Treasurer can submit
router.post(
  "/",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Treasurer"]),
  submitExpenditure
);

// Chairman can approve
router.patch(
  "/:id/approve",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Chairman"]),
  approveExpenditure
);

// Chairman can reject
router.patch(
  "/:id/reject",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Chairman"]),
  rejectExpenditure
);

export default router;
