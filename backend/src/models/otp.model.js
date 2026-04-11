const { pool } = require("../config/db");

async function saveOTP(userId, email, otpCode, expiresAt) {
    // Delete any existing OTPs for this user to avoid clutter
    await pool.query(`DELETE FROM OTPVerification WHERE UserID = ?`, [userId]);

    const [result] = await pool.query(
        `INSERT INTO OTPVerification (UserID, Email, OtpCode, ExpiresAt)
         VALUES (?, ?, ?, ?)`,
        [userId, email, otpCode, expiresAt]
    );
    return result.insertId;
}

async function verifyAndConsumeOTP(userId, otpCode) {
    const [rows] = await pool.query(
        `SELECT OTPID, ExpiresAt 
         FROM OTPVerification 
         WHERE UserID = ? AND OtpCode = ? 
         LIMIT 1`,
        [userId, otpCode]
    );

    if (rows.length === 0) {
        return { valid: false, message: "Invalid OTP code." };
    }

    const otpData = rows[0];
    const now = new Date();

    if (new Date(otpData.ExpiresAt) < now) {
        // Expired, delete it
        await pool.query(`DELETE FROM OTPVerification WHERE OTPID = ?`, [otpData.OTPID]);
        return { valid: false, message: "OTP code has expired." };
    }

    // Valid, consume it
    await pool.query(`DELETE FROM OTPVerification WHERE OTPID = ?`, [otpData.OTPID]);
    return { valid: true };
}

module.exports = {
    saveOTP,
    verifyAndConsumeOTP
};
