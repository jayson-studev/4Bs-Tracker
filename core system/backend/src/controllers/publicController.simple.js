/**
 * SIMPLE VERSION - Get public blockchain data for transparency dashboard
 * Returns mock data for testing
 */
export const getPublicBlockchainData = async (req, res) => {
  try {
    console.log("📊 Public blockchain data requested");

    // Return mock data for now
    return res.json({
      status: "success",
      message: "Public blockchain data retrieved successfully (MOCK DATA)",
      data: {
        // Summary totals
        totalIncome: 100000,
        totalAllocations: 40000,
        totalExpenditures: 30000,
        availableBalance: 30000,

        // Transaction counts
        counts: {
          income: 5,
          allocations: 3,
          expenditures: 2,
          proposals: 4,
        },

        // Proposal statistics
        proposals: {
          total: 4,
          approved: 2,
          pending: 1,
          rejected: 1,
        },

        // Category breakdowns
        categories: {
          income: {
            "Tax Revenue": 50000,
            "Grants": 30000,
            "Donations": 20000,
          },
          allocations: {
            "Education": 15000,
            "Healthcare": 15000,
            "Infrastructure": 10000,
          },
          expenditures: {
            "Education": 12000,
            "Healthcare": 10000,
            "Infrastructure": 8000,
          },
        },

        // Timestamp
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error fetching public blockchain data:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch blockchain data",
      error: err.message,
    });
  }
};
