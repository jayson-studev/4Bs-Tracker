import express from "express";
import { getPublicBlockchainData } from "../controllers/publicController.js";

const router = express.Router();

/**
 * Public routes - no authentication required
 * These routes provide transparency by exposing blockchain data to the public
 */

// Test route
router.get("/test", (req, res) => {
  res.json({ status: "success", message: "Public routes are working!" });
});

// Get all blockchain data for public dashboard
router.get("/blockchain-data", getPublicBlockchainData);

export default router;
