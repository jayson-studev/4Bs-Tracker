import { PROPOSAL_FUND_SOURCES } from "../models/Proposal.js";

/**
 * Validate required fields for Proposal approval
 * @param {Object} proposal - Proposal record from MongoDB
 * @returns {Array} missingFields
 */
export const validateProposalFields = (proposal) => {
  const {
    amount,
    purpose,
    fundSource,
    expenseType,
    proposer,
    documentHash,
    treasurerAddress,
    chairmanAddress,
  } = proposal;

  const missingFields = [];

  if (!amount) missingFields.push("amount");
  if (!purpose) missingFields.push("purpose");
  if (!fundSource) missingFields.push("fundSource");
  if (!expenseType) missingFields.push("expenseType");
  if (!proposer) missingFields.push("proposer");
  if (!documentHash) missingFields.push("documentHash");
  if (!treasurerAddress) missingFields.push("treasurerAddress");
  if (!chairmanAddress) missingFields.push("chairmanAddress");

  // Validate fund source against predefined categories
  if (fundSource && !PROPOSAL_FUND_SOURCES.includes(fundSource)) {
    missingFields.push("fundSource (invalid category)");
  }

  return missingFields;
};
