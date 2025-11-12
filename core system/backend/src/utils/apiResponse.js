/**
 * Unified API response helper
 * Use for consistent success and error responses across controllers
 */
export const successResponse = (res, message, data = {}, code = 200) => {
  return res.status(code).json({
    status: "success",
    message,
    data,
  });
};
export const errorResponse = (res, message, details = [], code = 400) => {
  return res.status(code).json({
    status: "error",
    code,
    message,
    details,
  });
};
