import mongoose from "mongoose";

const ALLOCATION_TYPES = [
  "Barangay Development Fund (BDP)",
  "Sangguniang Kabataan (SK) Fund",
  "Calamity Fund (LDRRMF)",
  "Gender and Development (GAD) Fund",
  "Senior Citizens & Persons with Disability (PWD) Fund",
  "Local Council for the Protection of Children (LCPC) Fund",
  "Personal Services (PS)",
  "Maintenance and Other Operating Expenses (MOOE)"
];

const allocationSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  purpose: {
    type: String,
    required: true,
    enum: ALLOCATION_TYPES,
    message: "Invalid allocation type. Must be one of the predefined categories."
  },
  fundSource: { type: String, required: true }, // e.g., "General Fund", "Trust Fund"
  supportingDocument: { type: String, required: true }, // File path or base64
  documentHash: String, // SHA-256 hash, generated on approval

  status: { type: String, enum: ["PROPOSED", "APPROVED", "REJECTED"], default: "PROPOSED" },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Official", required: true },
  createdByRole: String,
  createdAt: { type: Date, default: Date.now },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Official" },
  approvedAt: Date,

  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Official" },
  rejectedAt: Date,
  rejectionReason: String,

  txHash: String, // Blockchain transaction hash
  onChain: { type: Boolean, default: false }
});

export { ALLOCATION_TYPES };
export default mongoose.model("Allocation", allocationSchema);
