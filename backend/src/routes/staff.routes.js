const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const paymentsController = require("../controllers/admin/payments.controller");
const attendanceController = require("../controllers/admin/attendance.controller");
const bookingsController = require("../controllers/admin/bookings.controller");

// Staff Payments Routes - Maps to the exact same controller logic as Admin
router.get("/staff/payments", requireAuth, requireRole("STAFF"), paymentsController.listPayments);
router.patch("/staff/payments/:id/verify", requireAuth, requireRole("STAFF"), paymentsController.verifyPayment);
router.patch("/staff/payments/:id/reject", requireAuth, requireRole("STAFF"), paymentsController.rejectPayment);

// Staff Attendance Routes - Maps to the exact same controller logic as Admin
router.get("/staff/attendance/classes", requireAuth, requireRole("STAFF"), attendanceController.getClassesForAttendance);
router.get("/staff/attendance", requireAuth, requireRole("STAFF"), attendanceController.getSessionAttendance);
router.post("/staff/attendance/mark", requireAuth, requireRole("STAFF"), attendanceController.markAttendance);

// Staff Bookings Routes
router.get("/staff/bookings", requireAuth, requireRole("STAFF"), bookingsController.listBookings);

const enrollmentsController = require("../controllers/admin/enrollments.controller");
const classesController = require("../controllers/admin/classes.controller");

router.get("/staff/classes/sessions", requireAuth, requireRole("STAFF"), classesController.listSessions);
router.get("/staff/classes/recent-cancellations", requireAuth, requireRole("STAFF"), classesController.getRecentCancellations);
router.patch("/staff/classes/cancel-alert/:sessionId/acknowledge", requireAuth, requireRole("STAFF"), classesController.acknowledgeCancellation);

// Added for Staff View-Only Access
router.get("/staff/classes", requireAuth, requireRole("STAFF"), classesController.getClasses);
router.get("/staff/enrollments", requireAuth, requireRole("STAFF"), enrollmentsController.listEnrollments);

module.exports = router;
