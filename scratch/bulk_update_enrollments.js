const fs = require('fs');
const path = require('path');

// Manually load environment variables from .env
const envPath = path.join(__dirname, '../backend/.env');
const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) process.env[key.trim()] = value.trim();
});

// Import mysql2 from nested backend node_modules
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));

async function bulkUpdateEnrollments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [result] = await connection.query("UPDATE enrollment SET Status = 'ENROLLED'");
    console.log(`Bulk update successful. Affected rows: ${result.affectedRows}`);
    process.exit(0);
  } catch (err) {
    console.error("Bulk update failed:", err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

bulkUpdateEnrollments();
