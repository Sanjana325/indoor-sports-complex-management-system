const { saveOTP, verifyAndConsumeOTP } = require("../../models/otp.model");
const emailService = require("../../services/email.service");
const { findById } = require("../../models/user.model");

// Generate a random 6-character string containing digits
function generateRandomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function requestBookingOtp(req, res, next) {
    try {
        const userId = req.user?.UserID;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Fetch user from DB to get the correct email to send to
        const user = await findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const otpCode = generateRandomCode();
        // Set expiry for 10 minutes from now
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Save into Database
        await saveOTP(userId, user.Email, otpCode, expiresAt);

        // Send Email via Brevo
        await emailService.sendBookingOtpEmail({
            toEmail: user.Email,
            toName: user.FirstName ? `${user.FirstName} ${user.LastName}` : "Player",
            otpCode
        });

        res.status(200).json({ message: "OTP sent to your registered email successfully." });
    } catch (err) {
        next(err);
    }
}

async function verifyBookingOtp(req, res, next) {
    try {
        const userId = req.user?.UserID;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { otpCode } = req.body;
        if (!otpCode || typeof otpCode !== "string") {
            return res.status(400).json({ message: "Invalid OTP code provided." });
        }

        const result = await verifyAndConsumeOTP(userId, otpCode);
        if (!result.valid) {
            return res.status(400).json({ message: result.message });
        }

        res.status(200).json({ message: "OTP verified successfully." });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    requestBookingOtp,
    verifyBookingOtp
};
