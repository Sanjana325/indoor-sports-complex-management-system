const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signToken(payload) {
  return jwt.sign(payload, env.auth.jwtSecret, { expiresIn: env.auth.jwtExpiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.auth.jwtSecret);
}

module.exports = {
  signToken,
  verifyToken
};
