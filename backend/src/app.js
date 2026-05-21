// main express application configuration
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// security and request parsing middleware
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// register api routes
app.use("/api", routes);

// handle unknown routes and errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;

