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

const forgotLimiter = new Map();
const FORGOT_LIMIT_WINDOW_MS = 60 * 1000;
const FORGOT_LIMIT_MAX = 5;

const loginLimiter = new Map();
const LOGIN_LIMIT_WINDOW_MS = 60 * 1000;
const LOGIN_LIMIT_MAX = 8;

function nowMs() {
  return Date.now();
}

function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const e = email.trim();
  if (e.length < 6 || e.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(e);
}

function normalizePhone(phone) {
  if (typeof phone !== "string") return "";
  return phone.replace(/\s+/g, "").trim();
}

function isValidPhoneNumber(phone) {
  const p = normalizePhone(phone);

  if (!p) return false;

  if (/^\+94\d{9}$/.test(p)) return true;
  if (/^94\d{9}$/.test(p)) return true;
  if (/^0\d{9}$/.test(p)) return true;
  if (/^\d{9,12}$/.test(p)) return true;

  return false;
}

function passwordPolicyMessage() {
  return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
}

function isStrongPassword(pw) {
  if (typeof pw !== "string") return false;
  if (pw.length < 8) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  return true;
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

function isValidResetToken(rawToken) {
  if (typeof rawToken !== "string") return false;
  const t = rawToken.trim();
  return /^[a-f0-9]{64}$/i.test(t);
}

function hitForgotLimit(key) {
  const t = nowMs();
  const rec = forgotLimiter.get(key);

  if (!rec || t - rec.windowStart > FORGOT_LIMIT_WINDOW_MS) {
    forgotLimiter.set(key, { windowStart: t, count: 1 });
    return false;
  }

  rec.count += 1;
  forgotLimiter.set(key, rec);
  return rec.count > FORGOT_LIMIT_MAX;
}

function hitLoginLimit(key) {
  const t = nowMs();
  const rec = loginLimiter.get(key);

  if (!rec || t - rec.windowStart > LOGIN_LIMIT_WINDOW_MS) {
    loginLimiter.set(key, { windowStart: t, count: 1 });
    return false;
  }

  rec.count += 1;
  loginLimiter.set(key, rec);
  return rec.count > LOGIN_LIMIT_MAX;
}

router.post("/auth/register", async (req, res, next) => {
  try {
    const body = req.body || {};
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const email = normalizeEmail(body.email);
    const phoneNumber = normalizePhone(typeof body.phoneNumber === "string" ? body.phoneNumber : "");
    const password = typeof body.password === "string" ? body.password : "";

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: passwordPolicyMessage() });
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
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    const ip =
      (req.headers["x-forwarded-for"] && String(req.headers["x-forwarded-for"]).split(",")[0].trim()) ||
      req.ip ||
      "unknown";

    if (hitLoginLimit(`ip:${ip}`)) {
      return res.status(429).json({ message: "Too many login attempts. Please try again later." });
    }
    if (email && hitLoginLimit(`email:${email}`)) {
      return res.status(429).json({ message: "Too many login attempts. Please try again later." });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email or password" });
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
    const body = req.body || {};
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: passwordPolicyMessage() });
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
    const body = req.body || {};
    const email = normalizeEmail(body.email);

    const generic = { message: "If that email exists, we sent a reset link." };

    const ip =
      (req.headers["x-forwarded-for"] && String(req.headers["x-forwarded-for"]).split(",")[0].trim()) ||
      req.ip ||
      "unknown";

    if (hitForgotLimit(`ip:${ip}`)) {
      return res.json(generic);
    }
    if (email && hitForgotLimit(`email:${email}`)) {
      return res.json(generic);
    }

    if (!email || !isValidEmail(email)) {
      return res.json(generic);
    }

    const secret = process.env.RESET_TOKEN_SECRET || "";
    if (!secret || secret.length < 16) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.json(generic);
    }

    const { raw, tokenHash } = makeResetToken();

    const expiresAt = new Date(Date.now() + RESET_EXP_MINUTES * 60 * 1000);
    await userModel.createPasswordResetToken({
      userId: user.UserID,
      tokenHash,
      expiresAt
    });

    const frontendBase = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
    const resetLink = `${frontendBase.replace(/\/$/, "")}/reset-password?token=${raw}`;

    try {
      await sendPasswordResetEmail({
        toEmail: user.Email,
        toName: `${user.FirstName || ""} ${user.LastName || ""}`.trim(),
        resetLink
      });
    } catch (mailErr) {
      console.error("Forgot-password email failed:", mailErr && mailErr.message ? mailErr.message : mailErr);
    }

    return res.json(generic);
  } catch (err) {
    next(err);
  }
});

router.post("/auth/reset-password", async (req, res, next) => {
  try {
    const body = req.body || {};
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (!isValidResetToken(token)) {
      return res.status(400).json({ message: "Reset link is invalid or expired" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: passwordPolicyMessage() });
    }

    const secret = process.env.RESET_TOKEN_SECRET || "";
    if (!secret || secret.length < 16) {
      return res.status(500).json({ message: "Server configuration error" });
    }

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
