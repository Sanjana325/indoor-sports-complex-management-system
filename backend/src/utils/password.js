const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

// securely hash a plain text password before saving to database
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// compare a plain text password with a stored hash
async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = {
  hashPassword,
  verifyPassword
};

