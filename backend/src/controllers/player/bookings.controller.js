const { pool } = require("../../config/db");

exports.createBooking = async (req, res, next) => {
    try {
        const { courtId, sportId, startDateTime, endDateTime } = req.body;
        const userId = req.user.UserID;

        if (!courtId || !sportId || !startDateTime || !endDateTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        if (end <= start) {
            return res.status(400).json({ message: "End time must be after start time" });
        }

        // 1. Check for overlapping bookings
        const [bookings] = await pool.query(
            `SELECT BookingID FROM booking 
             WHERE CourtID = ? AND Status IN ('PENDING_PAYMENT', 'WAITING_VERIFICATION', 'CONFIRMED')
             AND (StartDateTime < ? AND EndDateTime > ?)`,
            [courtId, endDateTime, startDateTime]
        );
        if (bookings.length > 0) {
            return res.status(409).json({ message: "Conflict: This court is already booked during this time." });
        }

        // 2. Check for overlapping blocked slots
        const [blocked] = await pool.query(
            `SELECT BlockedSlotID FROM blockedslot
             WHERE CourtID = ?
             AND (StartDateTime < ? AND EndDateTime > ?)`,
            [courtId, endDateTime, startDateTime]
        );
        if (blocked.length > 0) {
            return res.status(409).json({ message: "Conflict: This court is blocked for maintenance or a private event during this time." });
        }

        // 3. Check for overlapping classes
        const dayOfWeek = start.getDay(); // 0=Sun, 1=Mon...
        const dateStr = startDateTime.split(' ')[0] || startDateTime.split('T')[0];
        const timeStart = start.toTimeString().slice(0, 5);
        const timeEnd = end.toTimeString().slice(0, 5);

        const [classSlots] = await pool.query(
            `SELECT c.ClassID
             FROM class c
             JOIN class_court cc ON c.ClassID = cc.ClassID
             JOIN classschedule sch ON c.ClassID = sch.ClassID
             LEFT JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
             LEFT JOIN classsession cs ON c.ClassID = cs.ClassID AND cs.SessionDate = ?
             WHERE cc.CourtID = ?
             AND c.Status = 'ACTIVE'
             AND c.StartDate <= ?
             AND (
                 (sch.ScheduleType = 'ONE_TIME' AND sch.OneTimeDate = ?)
                 OR
                 (sch.ScheduleType = 'WEEKLY' AND csd.Weekday = ?)
             )
             AND (cs.Status IS NULL OR cs.Status != 'CANCELLED')
             AND TIME(?) < sch.EndTime
             AND TIME(?) > sch.StartTime`,
            [dateStr, courtId, dateStr, dateStr, dayOfWeek, timeStart, timeEnd]
        );
        if (classSlots.length > 0) {
            return res.status(409).json({ message: "Conflict: This court is occupied by a class during this time." });
        }

        const [result] = await pool.query(
            "INSERT INTO booking (CourtID, SportID, UserID, StartDateTime, EndDateTime, Status) VALUES (?, ?, ?, ?, ?, 'PENDING_PAYMENT')",
            [courtId, sportId, userId, startDateTime, endDateTime]
        );

        res.status(201).json({ message: "Booking created", bookingId: result.insertId });
    } catch (err) {
        next(err);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const [rows] = await pool.query(
            `SELECT b.BookingID, b.StartDateTime, b.EndDateTime, b.Status, b.CreatedAt,
                    c.CourtName, s.SportName
             FROM booking b
             JOIN court c ON b.CourtID = c.CourtID
             JOIN sport s ON b.SportID = s.SportID
             WHERE b.UserID = ?
             ORDER BY b.StartDateTime DESC`,
            [userId]
        );
        res.json({ bookings: rows });
    } catch (err) {
        next(err);
    }
};

exports.cancelBooking = async (req, res, next) => {
    try {
        const bookingId = Number(req.params.id);
        const userId = req.user.UserID;

        if (!Number.isFinite(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID" });
        }

        const [result] = await pool.query(
            "UPDATE booking SET Status = 'CANCELLED' WHERE BookingID = ? AND UserID = ? AND Status != 'CANCELLED'",
            [bookingId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Booking not found or already cancelled" });
        }

        res.json({ message: "Booking cancelled successfully" });
    } catch (err) {
        next(err);
    }
};
