const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const coachController = require("../controllers/coach/coach.controller");

router.get("/coach/my-classes", requireAuth, requireRole("COACH"), coachController.getMyClasses);
router.get("/coach/sessions", requireAuth, requireRole("COACH"), coachController.getSessionsForDate);
router.patch("/coach/sessions/cancel", requireAuth, requireRole("COACH"), coachController.cancelSession);

module.exports = router;
