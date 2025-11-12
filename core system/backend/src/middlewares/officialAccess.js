/**
 * Ensure that the user is an active official (Chairman or Treasurer)
 */
export const requireActiveOfficial = (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ status: "error", message: "Unauthorized" });

  if (!req.user.isActive)
    return res
      .status(403)
      .json({ status: "error", message: "Official account is inactive" });

  if (!["Chairman", "Treasurer"].includes(req.user.role)) {
    return res.status(403).json({
      status: "error",
      message: "Only authorized officials can perform this action",
    });
  }

  next();
};

/**
 * Ensure that the user's role matches allowed roles
 */
export const requireRole = (roles) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ status: "error", message: "Unauthorized" });

  if (!req.user.isActive)
    return res
      .status(403)
      .json({ status: "error", message: "Official account is inactive" });

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      status: "error",
      message: `Access restricted to: ${roles.join(", ")}`,
    });
  }

  next();
};
