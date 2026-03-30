require('dotenv').config();
const { pool } = require('./src/config/db');

async function fix() {
  try {
    // For PAY-29 (image/upload), Cloudinary will natively render the JPG if requested!
    await pool.query(
      "UPDATE payment SET SlipPath = REPLACE(SlipPath, '.pdf', '.jpg') WHERE PaymentID = 29"
    );
    console.log("Fixed PAY-29 URL to ask for JPG natively!");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
