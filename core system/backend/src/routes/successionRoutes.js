import express from "express";
import { sendOtp, verifyAndIssueSuccessionTokens } from "../controllers/successionController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.post("/send-otp", requireAuth, requireRole(["Chairman"]), sendOtp);
router.post("/verify", requireAuth, requireRole(["Chairman"]), verifyAndIssueSuccessionTokens);

export default router;
