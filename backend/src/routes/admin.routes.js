const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const userModel = require("../models/user.model");
const coachModel = require("../models/coach.model");
const { hashPassword } = require("../utils/password");
const { generateTempPassword } = require("../utils/randomPassword");
const { pool } = require("../config/db");

function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

function canAdminManageTargetRole(targetRole) {
  return targetRole === "STAFF" || targetRole === "COACH" || targetRole === "PLAYER";
}

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

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
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

/*
  Update user (DB)
  - ADMIN can update STAFF/COACH/PLAYER
  - SUPER_ADMIN can update ADMIN/STAFF/COACH/PLAYER
  - Only SUPER_ADMIN can update ADMIN users
  - Non-super admin cannot edit ADMIN/SUPER_ADMIN users
*/
router.put("/admin/users/:userId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.userId);
    if (!Number.isFinite(targetUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { firstName, lastName, email, phoneNumber, role, specialization } = req.body || {};

    if (!firstName || !lastName || !email || !phoneNumber || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const target = await userModel.findById(targetUserId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const requesterRole = req.user.Role;

    if (requesterRole !== "SUPER_ADMIN" && (target.Role === "ADMIN" || target.Role === "SUPER_ADMIN")) {
      return res.status(403).json({ message: "You are not allowed to edit this user" });
    }

    const allowedForAdmin = ["STAFF", "COACH", "PLAYER"];
    const allowedForSuperAdmin = ["ADMIN", "STAFF", "COACH", "PLAYER"];

    if (requesterRole === "SUPER_ADMIN") {
      if (!allowedForSuperAdmin.includes(role)) {
        return res.status(400).json({ message: "Role not allowed" });
      }
    } else {
      if (!allowedForAdmin.includes(role)) {
        return res.status(403).json({ message: "Only SUPER_ADMIN can assign ADMIN role" });
      }
    }

    if (role === "COACH" && !specialization) {
      return res.status(400).json({ message: "Specialization is required for COACH" });
    }

    const emailTaken = await userModel.emailExistsExceptUser(email, targetUserId);
    if (emailTaken) return res.status(409).json({ message: "Email already exists" });

    await userModel.updateUserById(targetUserId, {
      firstName,
      lastName,
      email,
      phoneNumber,
      role
    });

    const wasCoach = target.Role === "COACH";
    const willBeCoach = role === "COACH";

    if (wasCoach && willBeCoach) {
      await pool.query("UPDATE Coach SET Specialization = ? WHERE UserID = ?", [specialization, targetUserId]);
    } else if (!wasCoach && willBeCoach) {
      await coachModel.createCoach({ userId: targetUserId, specialization });
    } else if (wasCoach && !willBeCoach) {
      await pool.query("DELETE FROM Coach WHERE UserID = ?", [targetUserId]);
    }

    res.json({
      message: "User updated",
      user: { userId: targetUserId, role, email }
    });
  } catch (err) {
    next(err);
  }
});

/*
  Disable user (soft)
  - ADMIN + SUPER_ADMIN can disable
  - ADMIN can only disable STAFF/COACH/PLAYER
  - SUPER_ADMIN can disable ADMIN/STAFF/COACH/PLAYER
  - No one can disable themselves
  - Cannot disable last active SUPER_ADMIN
*/
router.patch("/admin/users/:userId/disable", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.userId);
    if (!Number.isFinite(targetUserId)) return res.status(400).json({ message: "Invalid user id" });

    if (targetUserId === req.user.UserID) {
      return res.status(400).json({ message: "You cannot disable your own account" });
    }

    const target = await userModel.findById(targetUserId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const requesterRole = req.user.Role;

    if (requesterRole !== "SUPER_ADMIN") {
      if (!canAdminManageTargetRole(target.Role)) {
        return res.status(403).json({ message: "You are not allowed to disable this user" });
      }
    }

    if (target.Role === "SUPER_ADMIN") {
      const activeCount = await userModel.countActiveSuperAdmins();
      if (activeCount <= 1) {
        return res.status(400).json({ message: "Cannot disable the last active SUPER_ADMIN" });
      }
    }

    await userModel.setActiveById(targetUserId, false);
    res.json({ message: "User disabled" });
  } catch (err) {
    next(err);
  }
});

/*
  Enable user (reactivate)
  - ADMIN + SUPER_ADMIN can enable
  - ADMIN can only enable STAFF/COACH/PLAYER
  - SUPER_ADMIN can enable ADMIN/STAFF/COACH/PLAYER
  - No one can enable themselves is allowed (harmless), but keep consistent with disable -> allow self enable if needed
*/
router.patch("/admin/users/:userId/enable", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.userId);
    if (!Number.isFinite(targetUserId)) return res.status(400).json({ message: "Invalid user id" });

    const target = await userModel.findById(targetUserId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const requesterRole = req.user.Role;

    if (requesterRole !== "SUPER_ADMIN") {
      if (!canAdminManageTargetRole(target.Role)) {
        return res.status(403).json({ message: "You are not allowed to enable this user" });
      }
    }

    await userModel.setActiveById(targetUserId, true);
    res.json({ message: "User enabled" });
  } catch (err) {
    next(err);
  }
});

/*
  Remove user (hard delete)
  - SUPER_ADMIN only
  - Cannot delete yourself
  - Cannot delete last active SUPER_ADMIN
  - Deletes CoachQualification + Coach row first if target is COACH (to satisfy FKs)
*/
router.delete("/admin/users/:userId", requireAuth, requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.userId);
    if (!Number.isFinite(targetUserId)) return res.status(400).json({ message: "Invalid user id" });

    if (targetUserId === req.user.UserID) {
      return res.status(400).json({ message: "You cannot remove your own account" });
    }

    const target = await userModel.findById(targetUserId);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.Role === "SUPER_ADMIN") {
      const activeCount = await userModel.countActiveSuperAdmins();
      if (activeCount <= 1) {
        return res.status(400).json({ message: "Cannot remove the last active SUPER_ADMIN" });
      }
    }

    await userModel.deleteUserHardById(targetUserId);
    res.json({ message: "User removed" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
