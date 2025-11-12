import mongoose from "mongoose";

const REVENUE_SOURCES = [
  "National Tax Allotment (NTA)",
  "Share of Real Property Tax (RPT)",
  "Share of Community Tax",
  "Taxes on Stores/Retailers",
  "Barangay Fees & Charges",
  "Revenue from Operations",
  "Grants, Aid, & Donations"
];

const incomeSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  revenueSource: {
    type: String,
    required: true,
    enum: REVENUE_SOURCES,
    message: "Invalid revenue source. Must be one of the predefined categories."
  },
  supportingDocument: { type: String, required: true }, // File path or base64
  documentHash: String, // SHA-256 hash, generated when recorded

  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Official", required: true },
  recordedByRole: String,
  recordedAt: { type: Date, default: Date.now },

  txHash: String, // Blockchain transaction hash
  onChain: { type: Boolean, default: false }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

export { REVENUE_SOURCES };
export default mongoose.model("Income", incomeSchema);
