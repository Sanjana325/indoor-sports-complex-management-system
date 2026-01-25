const express = require("express");
const router = express.Router();

const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");

router.use(healthRoutes);
router.use(authRoutes);
router.use(adminRoutes);

module.exports = router;
