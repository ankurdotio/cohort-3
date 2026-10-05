const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const env = require("../config/env");

// Short-lived token sent in the "Authorization: Bearer <token>" header.
function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY }
  );
}

// Long-lived token stored in an httpOnly cookie. Only used to get new access tokens.
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id.toString() },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY }
  );
}

// bcrypt only looks at the first 72 bytes of its input, and every JWT for the same
// user starts with the same 72 bytes. So we first squash the token into a short
// SHA-256 digest (64 chars) and bcrypt that instead of the raw token.
function digest(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function hashRefreshToken(token) {
  return bcrypt.hash(digest(token), 10);
}

async function compareRefreshToken(token, hash) {
  return bcrypt.compare(digest(token), hash);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
};
