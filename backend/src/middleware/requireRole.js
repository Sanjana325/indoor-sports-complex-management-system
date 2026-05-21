module.exports = (...allowedRoles) => {
  const flatAllowed = allowedRoles.flat().filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!flatAllowed.includes(req.user.Role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
