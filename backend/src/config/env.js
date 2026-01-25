const dotenv = require("dotenv");

dotenv.config();

function mustGet(name) {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  db: {
    host: mustGet("DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    user: mustGet("DB_USER"),
    password: mustGet("DB_PASSWORD"),
    name: mustGet("DB_NAME")
  },

  auth: {
    jwtSecret: mustGet("JWT_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h"
  }
};

module.exports = env;
