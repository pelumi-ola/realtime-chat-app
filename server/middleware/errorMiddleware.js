const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
     message:
      statusCode >= 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
};

export default errorHandler;
