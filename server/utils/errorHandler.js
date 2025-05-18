class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleError = (err, req, res) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  return res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    details: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      path: req.path
    } : undefined
  });
};

module.exports = {
  AppError,
  handleError
};