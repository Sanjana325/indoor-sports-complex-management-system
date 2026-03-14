const express = require("express");
const router = express.Router();

const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");
const playerRoutes = require("./player.routes");

router.use(healthRoutes);
router.use(authRoutes);
router.use(adminRoutes);
router.use(playerRoutes);

module.exports = router;
