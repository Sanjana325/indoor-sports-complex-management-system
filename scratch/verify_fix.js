const mysql = require("mysql2/promise");
require("dotenv").config({ path: "./backend/.env" });

async function verifyExpiration() {
    let pool;
    try {
        pool = mysql.createPool({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME
        });

        console.log("Creating test booking (15 mins old)...");
        // Get valid user and court/sport IDs
        const [[user]] = await pool.query("SELECT UserID FROM useraccount LIMIT 1");
        const [[court]] = await pool.query("SELECT CourtID FROM court LIMIT 1");
        const [[sport]] = await pool.query("SELECT SportID FROM sport LIMIT 1");

        if (!user || !court || !sport) {
            console.error("Missing seeds in DB to run test.");
            return;
        }

        const [res] = await pool.query(
            "INSERT INTO booking (CourtID, SportID, UserID, StartDateTime, EndDateTime, Status, CreatedAt) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'PENDING_PAYMENT', DATE_SUB(NOW(), INTERVAL 15 MINUTE))",
            [court.CourtID, sport.SportID, user.UserID]
        );
        const bookingId = res.insertId;
        console.log(`Inserted booking ID: ${bookingId}`);

        console.log("Checking if logic works...");
        // Instead of waiting a minute, we just run the query logic manually to verify it handles the data correctly
        const [updateRes] = await pool.query(
            "UPDATE booking SET Status = 'EXPIRED' WHERE Status = 'PENDING_PAYMENT' AND CreatedAt < NOW() - INTERVAL 10 MINUTE AND BookingID = ?",
            [bookingId]
        );

        if (updateRes.affectedRows === 1) {
            console.log("SUCCESS: Test booking was correctly identified and EXPIRED.");
        } else {
            console.error("FAILURE: Test booking was NOT expired. Check query logic or timezones.");
        }

        // Cleanup
        await pool.query("DELETE FROM booking WHERE BookingID = ?", [bookingId]);
        console.log("Cleanup done.");

    } catch (err) {
        console.error("Verification script failed:", err);
    } finally {
        if (pool) await pool.end();
    }
}

verifyExpiration();
