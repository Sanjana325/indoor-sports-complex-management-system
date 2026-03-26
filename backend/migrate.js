const { pool } = require("./src/config/db");

async function migrate() {
  try {
    console.log("Starting migration...");
    await pool.query("ALTER TABLE booking MODIFY COLUMN Status ENUM('PENDING', 'PENDING_PAYMENT', 'WAITING_VERIFICATION', 'CONFIRMED', 'CANCELLED', 'EXPIRED') DEFAULT 'PENDING_PAYMENT'");
    const [res] = await pool.query("UPDATE booking SET Status = 'PENDING_PAYMENT' WHERE Status = 'PENDING'");
    console.log(`Updated ${res.affectedRows} rows to PENDING_PAYMENT.`);
    await pool.query("ALTER TABLE booking MODIFY COLUMN Status ENUM('PENDING_PAYMENT', 'WAITING_VERIFICATION', 'CONFIRMED', 'CANCELLED', 'EXPIRED') DEFAULT 'PENDING_PAYMENT'");
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
