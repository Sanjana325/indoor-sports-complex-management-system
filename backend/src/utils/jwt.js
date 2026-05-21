const jwt = require("jsonwebtoken");
const env = require("../config/env");

// create a secure JWT token for user authentication
function signToken(payload) {
  return jwt.sign(payload, env.auth.jwtSecret, { expiresIn: env.auth.jwtExpiresIn });
}

// validate a JWT token and extract its payload
function verifyToken(token) {
  return jwt.verify(token, env.auth.jwtSecret);
}

module.exports = {
  signToken,
  verifyToken
};

