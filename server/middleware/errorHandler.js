/**
 * Express Error Handling Middleware.
 * Catches route errors and formats them into a consistent JSON response.
 */
export const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error caught in middleware:", err.stack || err.message || err);
  
  // Set response status code (default to 500 if not previously set)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    error: err.message || "An unexpected server-side error occurred."
  });
};
