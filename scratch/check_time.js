const mysql = require("mysql2/promise");
require("dotenv").config({ path: "./backend/.env" });

async function checkTime() {
    try {
        const pool = mysql.createPool({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME
        });

        const [rows] = await pool.query("SELECT NOW() as mysql_now, @@time_zone as tz, @@system_time_zone as stz");
        console.log("MySQL NOW():", rows[0].mysql_now);
        console.log("MySQL Timezone:", rows[0].tz);
        console.log("MySQL System Timezone:", rows[0].stz);
        console.log("Node.js Time (Local):", new Date().toLocaleString());
        console.log("Node.js Time (ISO):", new Date().toISOString());

        const [counts] = await pool.query("SELECT Status, COUNT(*) as count FROM booking GROUP BY Status");
        console.log("Booking Status Counts:", counts);

        const [expirable] = await pool.query(
            "SELECT BookingID, CreatedAt FROM booking WHERE Status = 'PENDING_PAYMENT' AND CreatedAt < NOW() - INTERVAL 10 MINUTE"
        );
        console.log("Bookings eligible for expiration:", expirable);
        
        await pool.end();
    } catch (err) {
        console.error("Diagnostic failed:", err);
    }
}

checkTime();
