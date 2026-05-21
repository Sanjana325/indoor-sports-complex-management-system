const { saveOTP, verifyAndConsumeOTP } = require("../../models/otp.model");
const emailService = require("../../services/email.service");
const { findById } = require("../../models/user.model");

// generate a random 6-digit numeric code
function generateRandomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// send a 6-digit verification code to the player's email
async function requestBookingOtp(req, res, next) {
    try {
        const userId = req.user?.UserID;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // fetch user from DB to get the correct email
        const user = await findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const otpCode = generateRandomCode();
        // set OTP to expire in 10 minutes
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // save code into database for verification later
        await saveOTP(userId, user.Email, otpCode, expiresAt);

        // send the email
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

// check if the provided OTP is correct and not expired
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

        // check if OTP matches and is still valid
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

