import { REVENUE_SOURCES } from "../models/Income.js";

/**
 * Validate required fields for Income recording
 * @param {Object} income - Income record data
 * @returns {Array} missingFields - List of missing field names
 */
export const validateIncomeFields = (income) => {
  const { amount, revenueSource, documentHash, treasurerAddress } = income;

  const missingFields = [];

  if (!amount) missingFields.push("amount");
  if (!revenueSource) missingFields.push("revenueSource");
  if (!documentHash) missingFields.push("documentHash");
  if (!treasurerAddress) missingFields.push("treasurerAddress");

  // Validate revenue source against predefined categories
  if (revenueSource && !REVENUE_SOURCES.includes(revenueSource)) {
    missingFields.push("revenueSource (invalid category)");
  }

  return missingFields;
};
