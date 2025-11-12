import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Official from "../models/Official.js";
import OfficialInvite from "../models/OfficialInvite.js";
import { validationResult } from "express-validator";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { registerOfficialOnChain, deactivateOfficialOnChain } from "../services/officialsChainService.js";
import { autoLockSetup } from "../utils/setupWatcher.js";


export const registerOfficial = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return errorResponse(res, "Validation failed", errors.array(), 422);

  const { email, password, fullName, role, token, walletAddress, phoneNumber } = req.body;

  try {
    // First try to find invite by token and role only (for initial tokens with null email)
    // Then check if it matches the provided email (if invite has email) or if invite email is null
    const invite = await OfficialInvite.findOne({
      role,
      token,
      isUsed: false,
      $or: [
        { email: null }, // Initial tokens
        { email: email.toLowerCase() } // Succession tokens
      ]
    });
    if (!invite) return errorResponse(res, "Invalid or used invite token", [], 400);

    // If invite had no email (initial token), update it with the registrant's email
    if (!invite.email) {
      invite.email = email.toLowerCase();
    }

    const exists = await Official.findOne({ email: email.toLowerCase() });
    if (exists) return errorResponse(res, "Account already exists for this email", [], 409);

    const passwordHash = await bcrypt.hash(password, 12);

    const official = await Official.create({
      email: email.toLowerCase(),
      fullName,
      role,
      passwordHash,
      termStart: invite.termStart,
      termEnd: invite.termEnd,
      walletAddress,
      phoneNumber,
      isActive: true,
    });

    invite.isUsed = true;
    await invite.save();
    await autoLockSetup(); // Auto lock if both roles are registered

    // Auto-deactivate previous official with the same role (succession/replacement)
    const previousOfficial = await Official.findOne({
      role: role,
      isActive: true,
      _id: { $ne: official._id } // Not the one we just created
    });

    if (previousOfficial) {
      previousOfficial.isActive = false;
      await previousOfficial.save();

      // Also deactivate on blockchain
      try {
        await deactivateOfficialOnChain({
          from: process.env.CHAIN_SYSTEM_ACCOUNT,
          walletAddress: previousOfficial.walletAddress
        });
        console.log(`Auto-deactivated previous ${role}: ${previousOfficial.email}`);
      } catch (chainErr) {
        console.error("Chain deactivation error for previous official:", chainErr.message || chainErr);
      }
    }

    try {
      await registerOfficialOnChain({
        from: process.env.CHAIN_SYSTEM_ACCOUNT,
        walletAddress,
        fullName,
        email: official.email,
        role,
        termStart: invite.termStart,
        termEnd: invite.termEnd,
      });
    } catch (chainErr) {
      console.error("Chain registerOfficial error:", chainErr.message || chainErr);
    }

    return successResponse(res, "Official registered", {
      id: official._id,
      email: official.email,
      role: official.role,
      termStart: official.termStart,
      termEnd: official.termEnd,
      walletAddress: official.walletAddress,
    }, 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

export const loginOfficial = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return errorResponse(res, "Validation failed", errors.array(), 422);

  const { email, password } = req.body;
  try {
    const official = await Official.findOne({ email: email.toLowerCase() });
    if (!official) return errorResponse(res, "Invalid credentials", [], 401);

    // Check if account is active (deactivation handled by replacement registration)
    if (!official.isActive) {
      return errorResponse(res, "Account has been deactivated", [], 403);
    }

    const ok = await bcrypt.compare(password, official.passwordHash);
    if (!ok) return errorResponse(res, "Invalid credentials", [], 401);

    const token = jwt.sign({ sub: official._id.toString(), role: official.role }, process.env.JWT_SECRET, { expiresIn: "12h" });

    return successResponse(res, "Logged in", {
      token,
      official: {
        id: official._id,
        email: official.email,
        fullName: official.fullName,
        role: official.role,
        walletAddress: official.walletAddress,
        phoneNumber: official.phoneNumber,
        termStart: official.termStart,
        termEnd: official.termEnd
      }
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

export const logoutOfficial = async (req, res) => {
  try {
    // Since JWT is stateless, logout is primarily handled client-side by removing the token
    // The server confirms the logout request was received
    return successResponse(res, "Logged out successfully");
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

export const getAllOfficials = async (req, res) => {
  try {
    // Fetch all officials with basic information
    const officials = await Official.find()
      .select('-passwordHash') // Exclude password hash
      .sort({ isActive: -1, createdAt: -1 }); // Active first, then by creation date

    return successResponse(res, "Officials retrieved successfully", officials);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};
