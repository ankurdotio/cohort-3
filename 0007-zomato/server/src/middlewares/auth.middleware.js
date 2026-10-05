const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Verifies the access token from the "Authorization: Bearer <token>" header.
// The refresh token cookie is NOT used here.
function authUser(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token missing" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    // Tells the client to call POST /api/auth/refresh and try again
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired" });
    }
    return res.status(401).json({ message: "Invalid access token" });
  }
}

// Usage: authorize("owner") or authorize("customer", "owner"). Use after authUser.
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You are not allowed to do this" });
    }
    next();
  };
}

module.exports = { authUser, authorize };
