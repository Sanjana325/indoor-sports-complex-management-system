const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const userModel = require("../models/user.model");
const coachModel = require("../models/coach.model");
const { hashPassword } = require("../utils/password");
const { generateTempPassword } = require("../utils/randomPassword");

router.get("/admin/test", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), (req, res) => {
  res.json({
    message: "Admin access granted",
    user: {
      userId: req.user.UserID,
      email: req.user.Email,
      role: req.user.Role
    }
  });
});

router.get("/admin/users", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const rows = await userModel.listAllForAdmin();
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/users", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, role, specialization } = req.body || {};

    if (!firstName || !lastName || !email || !phoneNumber || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const allowedForAdmin = ["STAFF", "COACH", "PLAYER"];
    const allowedForSuperAdmin = ["ADMIN", "STAFF", "COACH", "PLAYER"];

    const requesterRole = req.user.Role;

    if (requesterRole === "SUPER_ADMIN") {
      if (!allowedForSuperAdmin.includes(role)) {
        return res.status(400).json({ message: "Role not allowed for this endpoint" });
      }
    } else {
      if (!allowedForAdmin.includes(role)) {
        return res.status(403).json({ message: "Only SUPER_ADMIN can create ADMIN" });
      }
    }

    if (role === "COACH" && !specialization) {
      return res.status(400).json({ message: "Specialization is required for COACH" });
    }

    const exists = await userModel.emailExists(email);
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const userId = await userModel.createUser({
      firstName,
      lastName,
      email,
      passwordHash,
      phoneNumber,
      role,
      mustChangePassword: true
    });

    let coachId = null;
    if (role === "COACH") {
      coachId = await coachModel.createCoach({ userId, specialization });
    }

    res.status(201).json({
      message: "User created",
      user: { userId, role, email, coachId },
      mustChangePassword: true,
      tempPassword
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
