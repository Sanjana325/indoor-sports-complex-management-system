const { pool } = require("../src/config/db");

async function migrate() {
    console.log("Migrating OTP Verification Table...");
    const conn = await pool.getConnection();
    try {
        await conn.query(`
            CREATE TABLE IF NOT EXISTS OTPVerification (
                OTPID INT AUTO_INCREMENT PRIMARY KEY,
                UserID INT NOT NULL,
                Email VARCHAR(255) NOT NULL,
                OtpCode VARCHAR(6) NOT NULL,
                ExpiresAt DATETIME NOT NULL,
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (UserID) REFERENCES UserAccount(UserID) ON DELETE CASCADE
            );
        `);
        console.log("OTPVerification table created successfully.");
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        conn.release();
        process.exit(0);
    }
}

migrate();
