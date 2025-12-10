// Centralized error handler to keep responses consistent
function errorHandler(err, req, res, next) {
  console.error(err)

  if (res.headersSent) {
    return next(err)
  }

  const status = err.status || 500
  const message = err.message || "Internal server error"

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

module.exports = errorHandler

