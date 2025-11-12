import mongoose from "mongoose";

const OfficialInviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: false, lowercase: true, default: null },
    role: { type: String, enum: ["Chairman", "Treasurer"], required: true },
    token: { type: String, required: true, unique: true },
    termStart: { type: Date, required: true },
    termEnd: { type: Date, required: true },
    validUntil: { type: Date },
    isUsed: { type: Boolean, default: false },
    issuedBy: { type: String, default: "SystemSetupAdmin" },
    issuedAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: "N/A" },
  },
  { timestamps: true }
);

export default mongoose.model("OfficialInvite", OfficialInviteSchema);
