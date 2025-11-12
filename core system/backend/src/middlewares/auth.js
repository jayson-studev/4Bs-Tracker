import jwt from "jsonwebtoken";
import Official from "../models/Official.js";

/**
 * Middleware to verify JWT token and attach user info to request.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "error", message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const official = await Official.findById(decoded.sub);

    if (!official) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid user" });
    }

    req.user = official;
    next();
  } catch (err) {
    console.error("Auth verification failed:", err.message);
    return res
      .status(401)
      .json({ status: "error", message: "Unauthorized or invalid token" });
  }
};

// ✅ Optional alias export for backward compatibility
export const authMiddleware = requireAuth;
