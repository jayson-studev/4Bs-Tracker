import Otp from "../models/Otp.js";

/**
 * Middleware for verifying OTP during succession token generation.
 * Expects { otpCode, userId } in the request body.
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { otpCode, userId } = req.body;

    if (!otpCode || !userId) {
      return res.status(400).json({ status: "error", message: "OTP code and userId are required" });
    }

    const otpRecord = await Otp.findOne({ userId, code: otpCode });

    if (!otpRecord) {
      return res.status(403).json({ status: "error", message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(403).json({ status: "error", message: "OTP expired" });
    }

    // OTP verified — mark as used
    otpRecord.verified = true;
    await otpRecord.save();

    // Continue to controller (e.g., generate succession tokens)
    next();
  } catch (err) {
    console.error("OTP verification error:", err.message);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
