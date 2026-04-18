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
    // 1. Find the OTP record for this user
    const [rows] = await pool.query(
        `SELECT OTPID, OtpCode, ExpiresAt, Attempts 
         FROM OTPVerification 
         WHERE UserID = ? 
         LIMIT 1`,
        [userId]
    );

    if (rows.length === 0) {
        return { valid: false, message: "No active OTP found. Please request a new one." };
    }

    const otpData = rows[0];
    const now = new Date();

    // 2. Check Expiry
    if (new Date(otpData.ExpiresAt) < now) {
        await pool.query(`DELETE FROM OTPVerification WHERE OTPID = ?`, [otpData.OTPID]);
        return { valid: false, message: "OTP code has expired. Please request a new one." };
    }

    // 3. Validate Code
    if (otpData.OtpCode === otpCode) {
        // Correct, consume it
        await pool.query(`DELETE FROM OTPVerification WHERE OTPID = ?`, [otpData.OTPID]);
        return { valid: true };
    } else {
        // Incorrect, increment attempts
        const newAttempts = (otpData.Attempts || 0) + 1;
        
        if (newAttempts >= 3) {
            // Too many attempts, invalidate the OTP
            await pool.query(`DELETE FROM OTPVerification WHERE OTPID = ?`, [otpData.OTPID]);
            return { valid: false, message: "Invalid OTP. Too many failed attempts. Please request a new code." };
        } else {
            await pool.query(
                `UPDATE OTPVerification SET Attempts = ? WHERE OTPID = ?`,
                [newAttempts, otpData.OTPID]
            );
            return { valid: false, message: `Invalid OTP code. ${3 - newAttempts} attempts remaining.` };
        }
    }
}

module.exports = {
    saveOTP,
    verifyAndConsumeOTP
};
