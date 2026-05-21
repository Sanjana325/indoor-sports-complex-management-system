const { verifyToken } = require("../utils/jwt");
const userModel = require("../models/user.model");

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const decoded = verifyToken(token);

    const user = await userModel.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.IsActive) return res.status(403).json({ message: "Account is disabled" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
