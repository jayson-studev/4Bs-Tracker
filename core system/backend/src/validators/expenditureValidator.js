import { EXPENDITURE_FUND_SOURCES } from "../models/Expenditure.js";

/**
 * Validate required fields for Expenditure approval
 * @param {Object} expenditure - Expenditure record from MongoDB
 * @returns {Array} missingFields - List of missing field names
 */
export const validateExpenditureFields = (expenditure) => {
  const {
    amount,
    purpose,
    fundSource,
    documentHash,
    treasurerAddress,
    chairmanAddress,
  } = expenditure;

  const missingFields = [];

  if (!amount) missingFields.push("amount");
  if (!purpose) missingFields.push("purpose");
  if (!fundSource) missingFields.push("fundSource");
  if (!documentHash) missingFields.push("documentHash");
  if (!treasurerAddress) missingFields.push("treasurerAddress");
  if (!chairmanAddress) missingFields.push("chairmanAddress");

  // Validate fund source against predefined categories
  if (fundSource && !EXPENDITURE_FUND_SOURCES.includes(fundSource)) {
    missingFields.push("fundSource (invalid category)");
  }

  return missingFields;
};
