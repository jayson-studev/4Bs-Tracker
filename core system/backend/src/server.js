import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import { authMiddleware } from "./middlewares/auth.js";


// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// Connect MongoDB
connectDB();

// Import routes
import allocationRoutes from "./routes/allocationRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import expenditureRoutes from "./routes/expenditureRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import officialRoutes from "./routes/officialRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

// Use routes
app.use("/api/allocations", authMiddleware, allocationRoutes);
app.use("/api/proposals", authMiddleware, proposalRoutes);
app.use("/api/expenditures", authMiddleware, expenditureRoutes);
app.use("/api/income", authMiddleware, incomeRoutes);
app.use("/api/officials", officialRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/public", publicRoutes); // Public routes - no auth required

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Barangay Budget Tracker Backend is running 🚀",
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint not found",
  });
});

// Global error handler (optional)
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
