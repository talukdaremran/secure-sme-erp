function notFound(req, res, next) {
  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.originalUrl}`,
  });
}

export default notFound;