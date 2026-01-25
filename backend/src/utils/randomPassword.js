const crypto = require("crypto");

function generateTempPassword() {
  const raw = crypto.randomBytes(9).toString("base64");
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
  return `Temp${cleaned.slice(0, 8)}!`;
}

module.exports = {
  generateTempPassword
};
