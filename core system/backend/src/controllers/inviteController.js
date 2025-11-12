import crypto from "crypto";
import Official from "../models/Official.js";
import Invite from "../models/OfficialInvite.js";

/**
 * UTIL: generate a secure random token string
 */
function generateToken(prefix = "INVITE") {
  const raw = crypto.randomBytes(16).toString("hex").toUpperCase();
  return `${prefix}-${raw}`;
}

/**
 * PUBLIC: Verify an invite token for a target role.
 * Body: { token, role }
 */
export const verifyInviteToken = async (req, res) => {
  try {
    const { token, role } = req.body;
    if (!token) {
      return res.status(400).json({ status: "error", message: "Token is required" });
    }

    const invite = await Invite.findOne({ token, isUsed: false });
    if (!invite) {
      return res.status(404).json({ status: "error", message: "Invalid or used token" });
    }

    if (role && invite.role !== role) {
      return res.status(400).json({ status: "error", message: "Token not valid for this role" });
    }

    return res.json({
      status: "success",
      message: "Token is valid",
      data: { role: invite.role, email: invite.email ?? null }
    });
  } catch (err) {
    console.error("verifyInviteToken error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

/**
 * SETUP-ONLY: Generate initial tokens for first Chairman & Treasurer.
 * Route should be guarded by setupGuard (no officials exist).
 */
export const generateInitialTokens = async (req, res) => {
  try {
    const existingOfficials = await Official.countDocuments();
    if (existingOfficials > 0) {
      return res.status(400).json({
        status: "error",
        message: "Setup already completed. Officials exist."
      });
    }

    const existingInvites = await Invite.countDocuments();
    if (existingInvites > 0) {
      return res.status(400).json({
        status: "error",
        message: "Initial tokens already generated. Proceed to registration."
      });
    }

    // Generate tokens
    const chairmanToken = generateToken("CHAIRMAN");
    const treasurerToken = generateToken("TREASURER");

    // Set term dates
    const now = new Date();
    const termStart = now; // Term starts when token is generated

    // DEMO MODE: Set to true for exhibition (30 seconds term)
    // PRODUCTION MODE: Set to false (4 years term)
    const DEMO_MODE = false;

    const termEnd = DEMO_MODE
      ? new Date(now.getTime() + 30 * 1000) // 30 seconds for demo
      : new Date(now.getFullYear() + 4, now.getMonth(), now.getDate()); // 4 years for production

    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Token valid for 30 days

    await Invite.insertMany([
      {
        role: "Chairman",
        token: chairmanToken,
        isUsed: false,
        issuedBy: "SystemSetup",
        ipAddress: req.ip || "N/A",
        termStart,
        termEnd,
        validUntil,
        email: null
      },
      {
        role: "Treasurer",
        token: treasurerToken,
        isUsed: false,
        issuedBy: "SystemSetup",
        ipAddress: req.ip || "N/A",
        termStart,
        termEnd,
        validUntil,
        email: null
      }
    ]);

    return res.status(201).json({
      status: "success",
      message: "Initial setup tokens generated",
      data: {
        chairman: {
          token: chairmanToken,
          expiresAt: validUntil,
          termStart,
          termEnd
        },
        treasurer: {
          token: treasurerToken,
          expiresAt: validUntil,
          termStart,
          termEnd
        }
      }
    });
  } catch (err) {
    console.error("generateInitialTokens error:", err);
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ status: "error", message: "Server error", details: err.message });
  }
};

/**
 * CHAIRMAN-ONLY: Generate succession tokens for the next term.
 * Route should enforce: requireAuth + requireRole(['Chairman']) + (optionally) verifyOtp.
 * Body: { nextChairmanEmail?, nextTreasurerEmail? } (emails optional)
 */
export const generateSuccessionTokens = async (req, res) => {
  try {
    // Route-level middleware should already ensure req.user is Chairman (and OTP verified if you use it)
    const chairmanId = req.user?._id;
    if (!chairmanId || req.user.role !== "Chairman") {
      return res.status(403).json({ status: "error", message: "Chairman only" });
    }

    const {
      nextChairmanEmail = null,
      nextTreasurerEmail = null,
      termStart,
      termEnd
    } = req.body || {};

    // Validate term dates
    if (!termStart || !termEnd) {
      return res.status(400).json({
        status: "error",
        message: "termStart and termEnd are required for succession tokens"
      });
    }

    const chairmanToken = generateToken("CHAIRMAN");
    const treasurerToken = generateToken("TREASURER");

    const now = new Date();
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await Invite.insertMany([
      {
        role: "Chairman",
        email: nextChairmanEmail,
        token: chairmanToken,
        isUsed: false,
        issuedBy: chairmanId,
        ipAddress: req.ip,
        termStart: new Date(termStart),
        termEnd: new Date(termEnd),
        validUntil
      },
      {
        role: "Treasurer",
        email: nextTreasurerEmail,
        token: treasurerToken,
        isUsed: false,
        issuedBy: chairmanId,
        ipAddress: req.ip,
        termStart: new Date(termStart),
        termEnd: new Date(termEnd),
        validUntil
      }
    ]);

    return res.status(201).json({
      status: "success",
      message: "Succession tokens generated",
      data: { chairman: chairmanToken, treasurer: treasurerToken }
    });
  } catch (err) {
    console.error("generateSuccessionTokens error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

/**
 * CHAIRMAN-ONLY: Generate a replacement token for a single role (immediate replacement).
 * This allows mid-term replacement of an official.
 * Body: { role: "Chairman" | "Treasurer", email? }
 */
export const generateReplacementToken = async (req, res) => {
  try {
    const chairmanId = req.user?._id;
    if (!chairmanId || req.user.role !== "Chairman") {
      return res.status(403).json({ status: "error", message: "Chairman only" });
    }

    const { role, email = null } = req.body || {};

    // Validate role
    if (!role || !["Chairman", "Treasurer"].includes(role)) {
      return res.status(400).json({
        status: "error",
        message: "Valid role required: Chairman or Treasurer"
      });
    }

    const token = generateToken(role.toUpperCase());
    const now = new Date();
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

    // For immediate replacement, use the current official's term dates
    const currentOfficial = await req.user.constructor.findOne({ role, isActive: true });

    let termStart = now;
    let termEnd = now;

    if (currentOfficial) {
      // Inherit term dates from current official
      termStart = currentOfficial.termStart;
      termEnd = currentOfficial.termEnd;
    } else {
      // Default: 4 years term if no current official exists
      termEnd = new Date(now.getFullYear() + 4, now.getMonth(), now.getDate());
    }

    await Invite.create({
      role,
      email,
      token,
      isUsed: false,
      issuedBy: chairmanId,
      ipAddress: req.ip,
      termStart,
      termEnd,
      validUntil
    });

    return res.status(201).json({
      status: "success",
      message: `Replacement token generated for ${role}`,
      data: {
        role,
        token,
        termStart,
        termEnd,
        validUntil,
        email: email || null
      }
    });
  } catch (err) {
    console.error("generateReplacementToken error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};
