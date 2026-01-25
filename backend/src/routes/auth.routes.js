const express = require("express");
const router = express.Router();

const userModel = require("../models/user.model");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");
const requireAuth = require("../middleware/requireAuth");

function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
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
      role: "PLAYER"
    });

    const token = signToken({ userId, role: "PLAYER" });

    res.status(201).json({
      message: "Registration successful",
      token,
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
      role: req.user.Role
    }
  });
});

module.exports = router;
