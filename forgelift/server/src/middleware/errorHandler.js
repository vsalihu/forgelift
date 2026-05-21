export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const statusCode = error.statusCode || (error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500);

  if (!isProduction) {
    console.error(error);
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource id." });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed.",
      errors: Object.values(error.errors || {}).map((item) => item.message)
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    return res.status(409).json({ message: `A record with that ${field} already exists.` });
  }

  return res.status(statusCode).json({
    message: statusCode === 500 && isProduction ? "Something went wrong." : error.message || "Something went wrong."
  });
};
