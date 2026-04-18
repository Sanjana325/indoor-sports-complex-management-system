const app = require("./app");
const env = require("./config/env");
const { testDbConnection } = require("./config/db");

const { pool } = require("./config/db");
const { initCronJobs } = require("./services/cron.service");

async function start() {
  await testDbConnection();

  // Start cron jobs
  initCronJobs();

  app.listen(env.port, () => {
    console.log(`API running on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
