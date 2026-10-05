// 404 for routes that do not exist
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler. Express 5 sends errors thrown in async controllers here.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Bad ObjectId, e.g. /api/restaurants/abc
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose schema validation failed
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Validation failed", errors });
  }

  // Broken JSON in the request body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
}

module.exports = { notFound, errorHandler };
