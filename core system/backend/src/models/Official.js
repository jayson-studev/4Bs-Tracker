import mongoose from "mongoose";

const OfficialSchema = new mongoose.Schema(
  {
  
phoneNumber: { type: String, required: true, unique: true, match: [/^\+639\d{9}$/, "Invalid PH phone format (+63xxxxxxxxxx)"] },
status: { type: String, enum: ["Active", "Inactive"], default: "Active" },

    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["Chairman", "Treasurer"], required: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    termStart: { type: Date, required: true },
    termEnd: { type: Date, required: true },
    walletAddress: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Official", OfficialSchema);
