const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const usersController = require("../controllers/admin/users.controller");
const sportsController = require("../controllers/admin/sports.controller");
const courtsController = require("../controllers/admin/courts.controller");
const qualificationsController = require("../controllers/admin/qualifications.controller");
const classesController = require("../controllers/admin/classes.controller");
const paymentsController = require("../controllers/admin/payments.controller");
const bookingsController = require("../controllers/admin/bookings.controller");
const enrollmentsController = require("../controllers/admin/enrollments.controller");
const attendanceController = require("../controllers/admin/attendance.controller");
const blockedSlotsController = require("../controllers/admin/blockedSlots.controller");
const reportsController = require("../controllers/admin/reports.controller");

// Test endpoint logic was in admin key "test", but not in any new controller. 
// I will inline it or create a general admin controller if needed. 
// Wait, "test" function was in admin.controller.js.
// User said: "Move functions exactly as-is".
// I missed "test" function in my file creation. 
// I will create `general.controller.js` or just inline it here for now to pass "don't create new route files" rule strictness?
// Actually, strict instructions listed users, sports, courts, qualifications. calling out specific functions.
// "test" function was NOT listed in the "Move functions exactly as-is" list provided by user.
// However, the rule "Existing admin endpoints must still resolve correctly" implies I need it.
// I will create `controllers/admin/general.controller.js` for it quickly or put it in users? 
// The user explicitly listed which functions to move where. "test" was NOT in the list. 
// But "Existing admin endpoints must still resolve correctly".
// I'll add `test` to `users.controller.js` for now as it returns user info, OR inline it. 
// Inline is safest to avoid "extra file" if not asked, but "Delete controllers/admin.controller.js" means I lose it if I don't move it.
// I'll put it in `users.controller.js` since it returns `req.user` info.

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

router.get("/admin/users", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.listUsers);
router.post("/admin/users", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.createUser);
router.put("/admin/users/:userId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.updateUser);
router.patch("/admin/users/:userId/disable", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.disableUser);
router.patch("/admin/users/:userId/enable", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.enableUser);
router.delete("/admin/users/:userId", requireAuth, requireRole("SUPER_ADMIN"), usersController.deleteUser);

router.get("/admin/sports", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), sportsController.listSports);
router.post("/admin/sports", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), sportsController.createSport);
router.put("/admin/sports/:sportId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), sportsController.updateSport);
router.delete("/admin/sports/:sportId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), sportsController.deleteSport);

router.get("/admin/courts", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), courtsController.listCourts);
router.post("/admin/courts", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), courtsController.createCourt);
router.put("/admin/courts/:courtId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), courtsController.updateCourt);
router.delete("/admin/courts/:courtId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), courtsController.deleteCourt);

router.get("/admin/qualifications", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), qualificationsController.listQualifications);
router.post("/admin/qualifications", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), qualificationsController.createQualification);

router.get("/admin/classes/sessions", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), classesController.listSessions);
router.get("/admin/classes/recent-cancellations", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), classesController.getRecentCancellations);
router.get("/admin/classes/cancellations/history", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), classesController.getCancelledSessionsHistory);
router.patch("/admin/classes/cancel-alert/:sessionId/acknowledge", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), classesController.acknowledgeCancellation);
router.get("/admin/classes/available-courts", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), classesController.getAvailableCourts);
router.get("/admin/coaches", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), classesController.getCoaches);
router.get("/admin/classes", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), classesController.getClasses);
router.post("/admin/classes", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), classesController.createClass);
router.put("/admin/classes/:classId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), classesController.updateClass);
router.patch("/admin/classes/:classId/deactivate", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), classesController.deactivateClass);
router.patch("/admin/classes/:classId/activate", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), classesController.activateClass);

router.get("/admin/payments/pending-count", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), paymentsController.getPendingCount);
router.get("/admin/payments", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), paymentsController.listPayments);
router.patch("/admin/payments/:id/verify", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), paymentsController.verifyPayment);
router.patch("/admin/payments/:id/reject", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), paymentsController.rejectPayment);

router.get("/admin/bookings", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), bookingsController.listBookings);
router.patch("/admin/bookings/:id/cancel", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), bookingsController.cancelBooking);

router.get("/admin/enrollments", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), enrollmentsController.listEnrollments);
router.patch("/admin/enrollments/:id/cancel", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), enrollmentsController.cancelEnrollment);

router.get("/admin/attendance/classes", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), attendanceController.getClassesForAttendance);
router.get("/admin/attendance", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), attendanceController.getSessionAttendance);
router.post("/admin/attendance/mark", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), attendanceController.markAttendance);

router.get("/admin/blocked-slots", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), blockedSlotsController.listBlockedSlots);
router.post("/admin/blocked-slots", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), blockedSlotsController.createBlockedSlot);
router.put("/admin/blocked-slots/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), blockedSlotsController.updateBlockedSlot);
router.delete("/admin/blocked-slots/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), blockedSlotsController.deleteBlockedSlot);

// Reports Routes
router.get("/admin/reports/dashboard-stats", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), reportsController.getDashboardStats);
router.get("/admin/reports/bookings", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), reportsController.getBookingsReport);
router.get("/admin/reports/payments", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), reportsController.getPaymentsReport);
router.get("/admin/reports/attendance", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), reportsController.getAttendanceReport);
router.get("/admin/reports/enrollments", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF"), reportsController.getEnrollmentsReport);

module.exports = router;
