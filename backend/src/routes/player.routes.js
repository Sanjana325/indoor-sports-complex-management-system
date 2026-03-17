const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const sportsController = require("../controllers/player/sports.controller");
const courtsController = require("../controllers/player/courts.controller");
const bookingsController = require("../controllers/player/bookings.controller");
const classesController = require("../controllers/player/classes.controller");
const paymentsController = require("../controllers/player/payments.controller");

// Apply middleware to all routes in this router
router.use(requireAuth);
router.use(requireRole("PLAYER"));

// Sports
router.get("/player/sports", sportsController.getActiveSports);

// Courts
router.get("/player/courts", courtsController.getCourtsBySport);
router.get("/player/courts/:courtId/availability", courtsController.getCourtAvailability);

// Bookings
router.post("/player/bookings", bookingsController.createBooking);
router.get("/player/bookings", bookingsController.getMyBookings);
router.patch("/player/bookings/:id/cancel", bookingsController.cancelBooking);

// Classes
router.get("/player/classes", classesController.getAvailableClasses);
router.post("/player/classes/:id/enroll", classesController.enrollInClass);
router.get("/player/my-classes", classesController.getMyClasses);

// Payments
router.get("/player/payments", paymentsController.getMyPayments);
router.post("/player/payments/initiate-booking", paymentsController.initiateBookingPayment);

module.exports = router;
