import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireActiveOfficial, requireRole } from "../middlewares/officialAccess.js";
import { recordIncome, getAllIncome, getRevenueSourceTypes } from "../controllers/incomeController.js";

const router = express.Router();

// Get valid revenue source types (accessible to all authenticated officials)
router.get(
  "/types",
  requireAuth,
  requireActiveOfficial,
  getRevenueSourceTypes
);

// Get all income records (accessible to all authenticated officials)
router.get(
  "/",
  requireAuth,
  requireActiveOfficial,
  getAllIncome
);

// Treasurer records income
router.post(
  "/record",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Treasurer"]),
  recordIncome
);

export default router;
