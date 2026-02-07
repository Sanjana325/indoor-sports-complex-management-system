const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const authController = require("../controllers/auth.controller");

router.post("/auth/register", authController.register);

router.post("/auth/login", authController.login);

router.get("/auth/me", requireAuth, authController.getMe);

router.post("/auth/change-password", requireAuth, authController.changePassword);

/*
  Forgot Password
  Always return 200 with a generic message to avoid leaking whether an email exists.
*/
router.post("/auth/forgot-password", authController.forgotPassword);

router.post("/auth/reset-password", authController.resetPassword);

module.exports = router;
