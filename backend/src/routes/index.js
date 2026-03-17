const express = require("express");
const router = express.Router();

const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");
const playerRoutes = require("./player.routes");
const paymentsController = require("../controllers/player/payments.controller");

router.use(healthRoutes);
router.post("/payments/notify", paymentsController.handlePayHereNotify);
router.use(authRoutes);
router.use(adminRoutes);
router.use(playerRoutes);

module.exports = router;
