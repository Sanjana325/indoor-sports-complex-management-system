const app = require("./app");
const env = require("./config/env");
const { testDbConnection } = require("./config/db");

const { pool } = require("./config/db");

async function start() {
  await testDbConnection();

  // Background scheduler: expire unpaid bookings older than 10 minutes
  setInterval(async () => {
    try {
      const [result] = await pool.query(
        `UPDATE booking 
         SET Status = 'EXPIRED' 
         WHERE Status = 'PENDING_PAYMENT' 
         AND CreatedAt < NOW() - INTERVAL 10 MINUTE`
      );
      if (result.affectedRows > 0) {
        console.log(`[Scheduler] Expired ${result.affectedRows} unpaid bookings.`);
      }
    } catch (err) {
      console.error("[Scheduler] Error expiring bookings:", err.message);
    }
  }, 60000); // Run every 60 seconds

  app.listen(env.port, () => {
    console.log(`API running on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
