const express = require("express");
const router = express.Router();

const { testDbConnection } = require("../config/db");

router.get("/health", async (req, res, next) => {
  try {
    await testDbConnection();
    res.json({
      status: "ok",
      service: "indoor-sports-complex-backend",
      db: "connected"
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
