const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const paymentsController = require("../controllers/admin/payments.controller");

// Staff Payments Routes - Maps to the exact same controller logic as Admin
router.get("/staff/payments", requireAuth, requireRole("STAFF"), paymentsController.listPayments);
router.patch("/staff/payments/:id/verify", requireAuth, requireRole("STAFF"), paymentsController.verifyPayment);
router.patch("/staff/payments/:id/reject", requireAuth, requireRole("STAFF"), paymentsController.rejectPayment);

module.exports = router;
