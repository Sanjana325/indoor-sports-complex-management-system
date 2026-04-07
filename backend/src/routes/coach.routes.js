const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const coachController = require("../controllers/coach/coach.controller");

router.get("/coach/my-classes", requireAuth, requireRole("COACH"), coachController.getMyClasses);
router.get("/coach/sessions", requireAuth, requireRole("COACH"), coachController.getSessionsForDate);
router.get("/coach/calendar", requireAuth, requireRole("COACH"), coachController.getCalendarData);
router.get("/coach/cancelled-sessions", requireAuth, requireRole("COACH"), coachController.getCancelledSessions);
router.get("/coach/classes/:classId/students", requireAuth, requireRole("COACH"), coachController.getEnrolledStudents);
router.get("/coach/sessions/:sessionId/attendance", requireAuth, requireRole("COACH"), coachController.getSessionAttendance);
router.patch("/coach/sessions/cancel", requireAuth, requireRole("COACH"), coachController.cancelSession);

module.exports = router;
