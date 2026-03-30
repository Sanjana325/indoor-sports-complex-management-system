require('dotenv').config();
const { pool } = require('./src/config/db');
const fs = require('fs');

async function check() {
  try {
    const [rows] = await pool.query("SELECT PaymentID, Method, Status, SlipPath FROM payment ORDER BY PaymentID DESC LIMIT 5");
    fs.writeFileSync('db_out.json', JSON.stringify(rows, null, 2));
    console.log("Wrote to db_out.json");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
