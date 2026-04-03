const { pool } = require("../../config/db");

// Get all bookings for admin
exports.listBookings = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT b.BookingID, b.StartDateTime, b.EndDateTime, b.Status, b.CreatedAt,
                    c.CourtName, c.PricePerHour, u.FirstName, u.LastName, u.PhoneNumber, 
                    s.SportName, s.ColorCode
             FROM booking b
             JOIN court c ON b.CourtID = c.CourtID
             JOIN useraccount u ON b.UserID = u.UserID
             JOIN sport s ON b.SportID = s.SportID
             ORDER BY b.CreatedAt DESC`
        );

        const bookings = rows.map(r => {
            const startDate = new Date(r.StartDateTime);
            const endDate = new Date(r.EndDateTime);
            
            // Format manually to avoid timezone shifting
            const yyyy = startDate.getFullYear();
            const mm = String(startDate.getMonth() + 1).padStart(2, '0');
            const dd = String(startDate.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            const startH = String(startDate.getHours()).padStart(2, '0');
            const startM = String(startDate.getMinutes()).padStart(2, '0');
            const endH = String(endDate.getHours()).padStart(2, '0');
            const endM = String(endDate.getMinutes()).padStart(2, '0');
            const timeStr = `${startH}:${startM} - ${endH}:${endM}`;

            return {
                id: `B-${String(r.BookingID).padStart(6, '0')}`,
                rawId: r.BookingID,
                playerName: `${r.FirstName} ${r.LastName}`,
                court: r.CourtName,
                date: dateStr,
                time: timeStr,
                createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : null,
                status: r.Status,
                phoneNumber: r.PhoneNumber,
                sportName: r.SportName,
                sportColor: r.ColorCode,
                pricePerHour: r.PricePerHour,
                startRaw: r.StartDateTime,
                endRaw: r.EndDateTime
            };
        });

        res.json({ bookings });
    } catch (err) {
        next(err);
    }
};

// Cancel a booking
exports.cancelBooking = async (req, res, next) => {
    let connection;
    try {
        const bookingId = req.params.id;
        connection = await pool.getConnection();

        // Check if booking exists
        const [bookRes] = await connection.query("SELECT * FROM booking WHERE BookingID = ?", [bookingId]);
        if (bookRes.length === 0) {
            connection.release();
            return res.status(404).json({ message: "Booking not found" });
        }
        
        await connection.query(
            "UPDATE booking SET Status = 'CANCELLED' WHERE BookingID = ?",
            [bookingId]
        );

        connection.release();
        res.json({ message: "Booking cancelled successfully" });
    } catch (err) {
        if (connection) connection.release();
        next(err);
    }
};
