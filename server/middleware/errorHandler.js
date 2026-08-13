/**
 * Express Error Handling Middleware.
 * Catches route errors and formats them into a consistent JSON response.
 */
export const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error caught in middleware:", err.stack || err.message || err);
  
  // Extract custom status or default to 500
  const statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  
  res.status(statusCode).json({
    error: err.message || "An unexpected server-side error occurred."
  });
};
