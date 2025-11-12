import { ALLOCATION_TYPES } from "../models/Allocation.js";

/**
 * Validate required fields for Allocation approval
 * @param {Object} allocation - Allocation record from MongoDB
 * @returns {Array} missingFields
 */
export const validateAllocationFields = (allocation) => {
  const {
    amount,
    allocationType,
    fundType,
    documentHash,
    treasurerAddress,
    chairmanAddress,
  } = allocation;

  const missingFields = [];

  if (!amount) missingFields.push("amount");
  if (!allocationType) missingFields.push("allocationType");
  if (!fundType) missingFields.push("fundType");
  if (!documentHash) missingFields.push("documentHash");
  if (!treasurerAddress) missingFields.push("treasurerAddress");
  if (!chairmanAddress) missingFields.push("chairmanAddress");

  // Validate allocation type against predefined categories
  if (allocationType && !ALLOCATION_TYPES.includes(allocationType)) {
    missingFields.push("allocationType (invalid category)");
  }

  return missingFields;
};
