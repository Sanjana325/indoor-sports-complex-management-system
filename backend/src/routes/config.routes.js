const express = require("express");
const router = express.Router();
const configController = require("../controllers/config.controller");

// public endpoint to retrieve bank details for payments
router.get("/config/bank-details", configController.getBankDetails);

module.exports = router;
