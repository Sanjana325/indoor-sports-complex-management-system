const db = require("../../config/db");

exports.createBooking = async (req, res, next) => {
    try {
        const { courtId, sportId, startDateTime, endDateTime } = req.body;
        const userId = req.user.userId;

        if (!courtId || !sportId || !startDateTime || !endDateTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const [result] = await db.query(
            "INSERT INTO booking (CourtID, SportID, UserID, StartDateTime, EndDateTime, Status) VALUES (?, ?, ?, ?, ?, 'PENDING')",
            [courtId, sportId, userId, startDateTime, endDateTime]
        );

        res.status(201).json({ message: "Booking created", bookingId: result.insertId });
    } catch (err) {
        next(err);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const [rows] = await db.query(
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
        const userId = req.user.userId;

        if (!Number.isFinite(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID" });
        }

        const [result] = await db.query(
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
