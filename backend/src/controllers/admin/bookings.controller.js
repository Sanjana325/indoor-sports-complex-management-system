const bookingModel = require("../../models/booking.model");

// get all court bookings with player and payment details
exports.listBookings = async (req, res, next) => {
    try {
        const rows = await bookingModel.listAllForAdmin();

        const bookings = rows.map(r => {
            const startDate = new Date(r.StartDateTime);
            const endDate = new Date(r.EndDateTime);
            
            // format dates and times for the dashboard view
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
                id: `BKG-${String(r.BookingID).padStart(6, '0')}`,
                rawId: r.BookingID,
                playerName: `${r.FirstName} ${r.LastName}`,
                playerEmail: r.Email,
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
                endRaw: r.EndDateTime,
                paymentId: r.PaymentID ? `PAY-${String(r.PaymentID).padStart(6, '0')}` : "-",
                paymentMethod: r.PaymentID ? (r.PaymentMethod === 'BANK_SLIP' ? "Bank Slip" : "Online") : "-"
            };
        });

        res.json({ bookings });
    } catch (err) {
        next(err);
    }
};

// cancel a court booking and update its status
exports.cancelBooking = async (req, res, next) => {
    try {
        const bookingId = Number(req.params.id);
        
        if (!Number.isFinite(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID" });
        }

        // update status to cancelled
        const success = await bookingModel.updateStatus(bookingId, 'CANCELLED');

        if (!success) {
            return res.status(404).json({ message: "Booking not found or already cancelled" });
        }

        res.json({ message: "Booking cancelled successfully" });
    } catch (err) {
        next(err);
    }
};

