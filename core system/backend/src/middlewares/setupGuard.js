/**
 * Prevent access if system setup has already been completed
 */
import Official from "../models/Official.js";

export const setupGuard = async (req, res, next) => {
  try {
    console.log("setupGuard: Checking for existing officials...");
    const officials = await Official.find();
    console.log("setupGuard: Found", officials.length, "officials");
    if (officials.length > 0) {
      return res.status(403).json({
        status: "error",
        message: "System setup already completed. Access denied.",
      });
    }
    console.log("setupGuard: Allowing setup to proceed");
    next();
  } catch (err) {
    console.error("Setup guard error:", err.message);
    console.error("Setup guard error stack:", err.stack);
    res.status(500).json({ status: "error", message: "Internal server error", details: err.message });
  }
};
