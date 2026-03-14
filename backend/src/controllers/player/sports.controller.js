const { pool } = require("../../config/db");

exports.getActiveSports = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            "SELECT SportID, SportName, ColorCode FROM sport WHERE IsActive = 1 AND IsBookable = 1 ORDER BY SportName ASC"
        );
        res.json({ sports: rows });
    } catch (err) {
        next(err);
    }
};
