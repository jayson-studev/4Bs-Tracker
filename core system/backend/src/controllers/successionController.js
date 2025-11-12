import bcrypt from "bcryptjs";
import crypto from "crypto";
import Official from "../models/Official.js";
import Otp from "../models/Otp.js";
import OfficialInvite from "../models/OfficialInvite.js";
import { sendOtpSms } from "../utils/smsService.js";

const OTP_TTL_MINUTES = 5;

const tokenFromRole = (role) => {
  const map = { Chairman: "CHR", Treasurer: "TRE" };
  const prefix = map[role] || "OFF";
  const hex = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `${prefix}-${hex}`;
};

export const sendOtp = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const me = await Official.findById(userId);
    if (!me || me.role !== "Chairman" || me.status === "Inactive") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    if (!me.phoneNumber) {
      return res.status(400).json({ status: "error", message: "Chairman has no phoneNumber on file" });
    }

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await Otp.updateMany({ userId: me._id, used: false }, { $set: { used: true } });
    await Otp.create({ userId: me._id, codeHash, expiresAt, used: false });

    await sendOtpSms(me.phoneNumber, code);

    return res.status(200).json({
      status: "success",
      message: "OTP sent to your registered number",
      data: { validForMinutes: OTP_TTL_MINUTES }
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err?.message || "Failed to send OTP" });
  }
};

export const verifyAndIssueSuccessionTokens = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { password, otp } = req.body || {};
    if (!password || !otp) {
      return res.status(400).json({ status: "error", message: "Password and OTP are required" });
    }

    const me = await Official.findById(userId).select("+passwordHash");
    if (!me || me.role !== "Chairman" || me.status === "Inactive") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    const ok = await bcrypt.compare(password, me.passwordHash);
    if (!ok) return res.status(401).json({ status: "error", message: "Invalid password" });

    const rec = await Otp.findOne({ userId: me._id, used: false }).sort({ createdAt: -1 });
    if (!rec) return res.status(400).json({ status: "error", message: "No active OTP. Please request a new one." });
    if (rec.expiresAt < new Date()) return res.status(400).json({ status: "error", message: "OTP expired" });

    const otpOk = await bcrypt.compare(String(otp), rec.codeHash);
    if (!otpOk) return res.status(400).json({ status: "error", message: "Invalid OTP" });

    rec.used = true;
    await rec.save();

    const now = new Date();
    const days = parseInt(process.env.TOKEN_EXPIRY_DAYS || "30", 10);
    const validUntil = new Date(now.getTime() + days * 86400000);

    const chairInvite = await OfficialInvite.create({
      email: "new-chairman@pending.local",
      role: "Chairman",
      token: tokenFromRole("Chairman"),
      termStart: now,
      termEnd: new Date(now.getTime() + 31536000000),
      validUntil,
      issuedBy: "Chairman",
      ipAddress: req.ip || "N/A",
    });

    const treInvite = await OfficialInvite.create({
      email: "new-treasurer@pending.local",
      role: "Treasurer",
      token: tokenFromRole("Treasurer"),
      termStart: now,
      termEnd: new Date(now.getTime() + 31536000000),
      validUntil,
      issuedBy: "Chairman",
      ipAddress: req.ip || "N/A",
    });

    console.log(`🧾 Succession tokens issued by ${me.email}: ${chairInvite.token}, ${treInvite.token}`);

    return res.status(201).json({
      status: "success",
      message: "Succession tokens generated",
      data: {
        chairman: { token: chairInvite.token, validUntil: chairInvite.validUntil },
        treasurer: { token: treInvite.token, validUntil: treInvite.validUntil },
      },
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err?.message || "Failed to verify and issue tokens" });
  }
};
