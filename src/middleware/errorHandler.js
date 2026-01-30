/**
 * Error Handler Middleware
 */

/**
 * Not Found Handler
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Endpoint tidak ditemukan: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Alias for backward compatibility
export const notFound = notFoundHandler;

/**
 * Global Error Handler
 * Catches all errors and sends appropriate response
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`[Error] ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Validation Error Handler
 * Formats express-validator errors for API response
 */
export const validationErrorHandler = (errors) => {
  return errors.array().map(error => ({
    field: error.path,
    message: error.msg
  }));
};

export default {
  notFound,
  notFoundHandler,
  errorHandler,
  validationErrorHandler
};