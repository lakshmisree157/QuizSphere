const formatResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    // If headers are already sent, don't do anything
    if (res.headersSent) {
      return;
    }

    // If it's an error response
    if (data.error) {
      return originalJson.call(this, {
        success: false,
        error: data.error,
        details: process.env.NODE_ENV === 'development' ? data.details : undefined
      });
    }

    // For successful responses
    return originalJson.call(this, {
      success: true,
      ...data
    });
  };
  next();
};

module.exports = formatResponse;