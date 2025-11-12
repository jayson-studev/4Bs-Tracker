import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireActiveOfficial, requireRole } from "../middlewares/officialAccess.js";
import { submitAllocation, approveAllocation, rejectAllocation, getAllAllocations, getAllocationTypes, getGeneralFund } from "../controllers/allocationController.js";

const router = express.Router();

// Get general fund information (accessible to all authenticated officials)
router.get(
  "/general-fund",
  requireAuth,
  requireActiveOfficial,
  getGeneralFund
);

// Get valid allocation types (accessible to all authenticated officials)
router.get(
  "/types",
  requireAuth,
  requireActiveOfficial,
  getAllocationTypes
);

// Get all allocations (accessible to all authenticated officials)
router.get(
  "/",
  requireAuth,
  requireActiveOfficial,
  getAllAllocations
);

// Treasurer can submit
router.post(
  "/",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Treasurer"]),
  submitAllocation
);

// Chairman can approve
router.patch(
  "/:id/approve",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Chairman"]),
  approveAllocation
);

// Chairman can reject
router.patch(
  "/:id/reject",
  requireAuth,
  requireActiveOfficial,
  requireRole(["Chairman"]),
  rejectAllocation
);

export default router;
