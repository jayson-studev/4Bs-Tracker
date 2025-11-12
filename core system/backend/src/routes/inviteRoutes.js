import express from "express";
import { setupGuard } from "../middlewares/setupGuard.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/officialAccess.js";
import {
  generateSuccessionTokens,
  verifyInviteToken,
  generateInitialTokens,
  generateReplacementToken
} from "../controllers/inviteController.js";

const router = express.Router();

// Initial setup route
router.post("/generate-initial-tokens", setupGuard, generateInitialTokens);

// Chairman-only: generate succession tokens
router.post(
  "/generate-succession-tokens",
  requireAuth,
  requireRole(["Chairman"]),
  generateSuccessionTokens
);

// Chairman-only: generate replacement token for immediate replacement
router.post(
  "/generate-replacement-token",
  requireAuth,
  requireRole(["Chairman"]),
  generateReplacementToken
);

// Validate token before official registration
router.post("/verify", verifyInviteToken);

export default router;
