const bookingModel = require("../../models/booking.model");

// create a new court booking after validating time and availability
exports.createBooking = async (req, res, next) => {
    try {
        const { courtId, sportId, startDateTime, endDateTime } = req.body;
        const userId = req.user.UserID;

        if (!courtId || !sportId || !startDateTime || !endDateTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const start = new Date(startDateTime);
        const end = new Date(endDateTime);

        // validate that booking is for the future
        if (start < new Date()) {
            return res.status(400).json({ message: "Cannot book a court for a past date or time." });
        }

        if (end <= start) {
            return res.status(400).json({ message: "End time must be after start time" });
        }

        // save booking to database
        const result = await bookingModel.createBooking({
            courtId,
            sportId,
            userId,
            startDateTime,
            endDateTime
        });

        if (!result.success) {
            return res.status(result.conflict ? 409 : 500).json({ message: result.message || "Failed to create booking" });
        }

        res.status(201).json({ message: "Booking created", bookingId: result.bookingId });
    } catch (err) {
        next(err);
    }
};

// get a list of all bookings for the logged-in player
exports.getMyBookings = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const rows = await bookingModel.listByUserId(userId);
        res.json({ bookings: rows });
    } catch (err) {
        next(err);
    }
};

// cancel a booking if it belongs to the player
exports.cancelBooking = async (req, res, next) => {
    try {
        const bookingId = Number(req.params.id);
        const userId = req.user.UserID;

        if (!Number.isFinite(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID" });
        }

        // update status to cancelled in database
        const success = await bookingModel.updateStatus(bookingId, 'CANCELLED', userId);

        if (!success) {
            return res.status(404).json({ message: "Booking not found or already cancelled" });
        }

        res.json({ message: "Booking cancelled successfully" });
    } catch (err) {
        next(err);
    }
};

