const { pool } = require("../../config/db");

exports.getCourtsBySport = async (req, res, next) => {
    try {
        const sportId = Number(req.query.sportId);
        if (!Number.isFinite(sportId)) {
            return res.status(400).json({ message: "Invalid sportId" });
        }

        const [rows] = await pool.query(
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
        
        // Calculate weekday for recurring class checks (0=Sun, 1=Mon, ..., 6=Sat)
        // Use UTC date to ensure the weekday matches the date string provided
        const [y, m, d] = date.split('-').map(Number);
        const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

        // 1. Get bookings overlapping this date
        const [bookings] = await pool.query(
            `SELECT StartDateTime, EndDateTime 
             FROM booking 
             WHERE CourtID = ? AND Status != 'CANCELLED'
             AND (StartDateTime < ? AND EndDateTime > ?)`,
            [courtId, endOfDay, startOfDay]
        );

        // 2. Get blocked slots overlapping this date
        const [blocked] = await pool.query(
            `SELECT StartDateTime, EndDateTime, Reason
             FROM blockedslot
             WHERE CourtID = ?
             AND (StartDateTime < ? AND EndDateTime > ?)`,
            [courtId, endOfDay, startOfDay]
        );

        // 3. Get active classes scheduled for this court on this date
        const [classSlots] = await pool.query(
            `SELECT sch.StartTime, sch.EndTime, c.Title AS Reason
             FROM class c
             JOIN class_court cc ON c.ClassID = cc.ClassID
             JOIN classschedule sch ON c.ClassID = sch.ClassID
             LEFT JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
             WHERE cc.CourtID = ?
             AND c.Status = 'ACTIVE'
             AND c.StartDate <= ?
             AND (
                 (sch.ScheduleType = 'ONE_TIME' AND sch.OneTimeDate = ?)
                 OR
                 (sch.ScheduleType = 'WEEKLY' AND csd.Weekday = ?)
             )`,
            [courtId, date, date, dayOfWeek]
        );

        // Map class slots to the same StartDateTime/EndDateTime format as bookings/blocked
        const classExclusions = classSlots.map(cls => ({
            StartDateTime: `${date} ${cls.StartTime}`,
            EndDateTime: `${date} ${cls.EndTime}`,
            Reason: `Class: ${cls.Reason}`,
            isClass: true
        }));

        res.json({ 
            bookings, 
            blocked: [...blocked, ...classExclusions] 
        });
    } catch (err) {
        next(err);
    }
};
