const { pool } = require("./src/config/db");

async function testExpiration() {
    try {
        console.log("Testing expiration logic...");

        // Find a valid user, court, and sport
        const [users] = await pool.query("SELECT UserID FROM useraccount LIMIT 1");
        const [courts] = await pool.query("SELECT CourtID FROM court LIMIT 1");
        const [sports] = await pool.query("SELECT SportID FROM sport LIMIT 1");

        if (!users.length || !courts.length || !sports.length) {
            console.error("Missing required master data (user, court, or sport).");
            process.exit(1);
        }

        const validUserId = users[0].UserID;
        const validCourtId = courts[0].CourtID;
        const validSportId = sports[0].SportID;

        // Insert a booking that was created 11 minutes ago
        const [insertRes] = await pool.query(`
            INSERT INTO booking (CourtID, SportID, UserID, StartDateTime, EndDateTime, Status, CreatedAt)
            VALUES (?, ?, ?, '2026-10-10 10:00:00', '2026-10-10 11:00:00', 'PENDING_PAYMENT', NOW() - INTERVAL 11 MINUTE)
        `, [validCourtId, validSportId, validUserId]);
        const newBookingId = insertRes.insertId;
        console.log(`Inserted dummy booking #${newBookingId} with PENDING_PAYMENT status and old CreatedAt.`);

        console.log("Waiting for the 60-second scheduler to run... please wait up to 65 seconds.");
        
        // Wait 65 seconds
        await new Promise(resolve => setTimeout(resolve, 65000));

        // Check if status changed to EXPIRED
        const [rows] = await pool.query("SELECT Status FROM booking WHERE BookingID = ?", [newBookingId]);
        if (rows.length > 0) {
            console.log(`Booking #${newBookingId} is now: ${rows[0].Status}`);
            if (rows[0].Status === 'EXPIRED') {
                console.log("✅ SUCCESS: The scheduler correctly expired the booking.");
            } else {
                console.log("❌ FAILURE: The scheduler did not expire the booking.");
            }
        }

        // Clean up
        await pool.query("DELETE FROM booking WHERE BookingID = ?", [newBookingId]);
        console.log("Cleaned up dummy booking.");

        process.exit(0);
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
}

testExpiration();
