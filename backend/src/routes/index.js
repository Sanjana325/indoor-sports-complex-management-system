const express = require("express");
const router = express.Router();

const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");
const playerRoutes = require("./player.routes");
const staffRoutes = require("./staff.routes");
const coachRoutes = require("./coach.routes");
const paymentsController = require("../controllers/player/payments.controller");

router.use(healthRoutes);
router.post("/payments/notify", (req, res, next) => {
    console.log(">>> [GLOBAL] POST /api/payments/notify hit! Body:", JSON.stringify(req.body));
    next();
}, paymentsController.handlePayHereNotify);
router.use(authRoutes);
router.use(adminRoutes);
router.use(staffRoutes);
router.use(coachRoutes);
router.use(playerRoutes);

module.exports = router;
