const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env" });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await pool.query("SELECT UserID, Email, Role FROM useraccount WHERE Role IN ('ADMIN', 'SUPER_ADMIN') LIMIT 3");
  console.log(rows);
  process.exit(0);
}
run();
