import mongoose from "mongoose";

// Fund sources for expenditures (same as allocation types)
const EXPENDITURE_FUND_SOURCES = [
  "Barangay Development Fund (BDP)",
  "Sangguniang Kabataan (SK) Fund",
  "Calamity Fund (LDRRMF)",
  "Gender and Development (GAD) Fund",
  "Senior Citizens & Persons with Disability (PWD) Fund",
  "Local Council for the Protection of Children (LCPC) Fund",
  "Personal Services (PS)",
  "Maintenance and Other Operating Expenses (MOOE)"
];

const expenditureSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  purpose: { type: String, required: true },
  fundSource: {
    type: String,
    required: true,
    enum: EXPENDITURE_FUND_SOURCES,
    message: "Invalid fund source. Must be one of the allocated fund types."
  },
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal" }, // Optional link to proposal
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

export { EXPENDITURE_FUND_SOURCES };
export default mongoose.model("Expenditure", expenditureSchema);
