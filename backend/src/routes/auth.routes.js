const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const userModel = require("../models/user.model");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");
const requireAuth = require("../middleware/requireAuth");
const { pool } = require("../config/db");
const { sendPasswordResetEmail } = require("../utils/email");

const RESET_EXP_MINUTES = 30;

function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function makeResetToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  const secret = process.env.RESET_TOKEN_SECRET || "";
  const tokenHash = sha256Hex(`${raw}.${secret}`);
  return { raw, tokenHash };
}

router.post("/auth/register", async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, password } = req.body || {};

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await userModel.emailExists(email);
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const passwordHash = await hashPassword(password);

    const userId = await userModel.createUser({
      firstName,
      lastName,
      email,
      passwordHash,
      phoneNumber,
      role: "PLAYER",
      mustChangePassword: false
    });

    const token = signToken({ userId, role: "PLAYER" });

    res.status(201).json({
      message: "Registration successful",
      token,
      mustChangePassword: false,
      user: {
        userId,
        firstName,
        lastName,
        email,
        phoneNumber,
        role: "PLAYER"
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await userModel.findByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.IsActive) return res.status(403).json({ message: "Account is disabled" });

    const ok = await verifyPassword(password, user.PasswordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken({ userId: user.UserID, role: user.Role });

    res.json({
      token,
      mustChangePassword: Boolean(user.MustChangePassword),
      user: {
        userId: user.UserID,
        firstName: user.FirstName,
        lastName: user.LastName,
        email: user.Email,
        role: user.Role
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  res.json({
    user: {
      userId: req.user.UserID,
      firstName: req.user.FirstName,
      lastName: req.user.LastName,
      email: req.user.Email,
      phoneNumber: req.user.PhoneNumber,
      role: req.user.Role,
      mustChangePassword: Boolean(req.user.MustChangePassword)
    }
  });
});

router.post("/auth/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const ok = await verifyPassword(currentPassword, req.user.PasswordHash);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

    const newHash = await hashPassword(newPassword);

    await pool.query(
      "UPDATE UserAccount SET PasswordHash = ?, MustChangePassword = FALSE WHERE UserID = ?",
      [newHash, req.user.UserID]
    );

    res.json({ message: "Password updated successfully", mustChangePassword: false });
  } catch (err) {
    next(err);
  }
});

/*
  Forgot Password
  Always return 200 with a generic message to avoid leaking whether an email exists.
*/
router.post("/auth/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.json({ message: "If that email exists, we sent a reset link." });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.json({ message: "If that email exists, we sent a reset link." });
    }

    const { raw, tokenHash } = makeResetToken();

    const expiresAt = new Date(Date.now() + RESET_EXP_MINUTES * 60 * 1000);
    await userModel.createPasswordResetToken({
      userId: user.UserID,
      tokenHash,
      expiresAt
    });

    const frontendBase = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
    const resetLink = `${frontendBase}/reset-password?token=${raw}`;

    await sendPasswordResetEmail({
      toEmail: user.Email,
      toName: `${user.FirstName || ""} ${user.LastName || ""}`.trim(),
      resetLink
    });

    return res.json({ message: "If that email exists, we sent a reset link." });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const secret = process.env.RESET_TOKEN_SECRET || "";
    const tokenHash = sha256Hex(`${token}.${secret}`);

    const row = await userModel.findValidPasswordResetTokenByHash(tokenHash);
    if (!row) {
      return res.status(400).json({ message: "Reset link is invalid or expired" });
    }

    const newHash = await hashPassword(newPassword);

    await pool.query(
      "UPDATE UserAccount SET PasswordHash = ?, MustChangePassword = FALSE WHERE UserID = ?",
      [newHash, row.UserID]
    );

    await userModel.markPasswordResetTokenUsed(row.ResetID);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
