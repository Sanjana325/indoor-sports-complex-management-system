const db = require("../../config/db");

exports.getActiveSports = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            "SELECT SportID, SportName, ColorCode FROM sport WHERE IsActive = 1 ORDER BY SportName ASC"
        );
        res.json({ sports: rows });
    } catch (err) {
        next(err);
    }
};
