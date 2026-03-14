const db = require("../../config/db");

exports.getCourtsBySport = async (req, res, next) => {
    try {
        const sportId = Number(req.query.sportId);
        if (!Number.isFinite(sportId)) {
            return res.status(400).json({ message: "Invalid sportId" });
        }

        const [rows] = await db.query(
            `SELECT c.CourtID, c.CourtName, c.Capacity, c.PricePerHour, c.Status 
             FROM court c
             JOIN court_sport cs ON c.CourtID = cs.CourtID
             WHERE cs.SportID = ? AND c.Status != 'MAINTENANCE'
             ORDER BY c.CourtName ASC`,
            [sportId]
        );
        res.json({ courts: rows });
    } catch (err) {
        next(err);
    }
};

exports.getCourtAvailability = async (req, res, next) => {
    try {
        const courtId = Number(req.params.courtId);
        const { date } = req.query; // Format: YYYY-MM-DD

        if (!Number.isFinite(courtId)) {
            return res.status(400).json({ message: "Invalid courtId" });
        }
        if (!date) {
            return res.status(400).json({ message: "Date is required (YYYY-MM-DD)" });
        }

        const startOfDay = `${date} 00:00:00`;
        const endOfDay = `${date} 23:59:59`;

        // Get bookings overlapping this date
        const [bookings] = await db.query(
            `SELECT StartDateTime, EndDateTime 
             FROM booking 
             WHERE CourtID = ? AND Status != 'CANCELLED'
             AND (StartDateTime < ? AND EndDateTime > ?)`,
            [courtId, endOfDay, startOfDay]
        );

        // Get blocked slots overlapping this date
        const [blocked] = await db.query(
            `SELECT StartDateTime, EndDateTime, Reason
             FROM blockedslot
             WHERE CourtID = ?
             AND (StartDateTime < ? AND EndDateTime > ?)`,
            [courtId, endOfDay, startOfDay]
        );

        res.json({ bookings, blocked });
    } catch (err) {
        next(err);
    }
};
