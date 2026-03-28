const paymentService = require("../../services/payment.service");

exports.getMyPayments = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const payments = await paymentService.getUserPayments(userId);
        res.json({ payments });
    } catch (err) {
        next(err);
    }
};

exports.initiateBookingPayment = async (req, res, next) => {
    try {
        if (!req.user || !req.user.UserID) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { bookingId } = req.body;
        const userId = req.user.UserID;

        if (!bookingId) {
            return res.status(400).json({ message: "Missing booking ID" });
        }

        const userDetails = {
            FirstName: req.user.FirstName,
            LastName: req.user.LastName,
            Email: req.user.Email,
            PhoneNumber: req.user.PhoneNumber
        };

        const paymentData = await paymentService.createOnlinePayment(userId, bookingId, userDetails);
        res.json(paymentData);

    } catch (err) {
        if (err.message === "Booking not found or not pending payment") {
            return res.status(404).json({ message: err.message });
        }
        next(err);
    }
};

exports.handlePayHereNotify = async (req, res, next) => {
    try {
        await paymentService.verifyPayHerePayment(req.body);
        res.send("OK");
    } catch (err) {
        if (err.message === "Invalid signature") {
            return res.status(400).send("Invalid signature");
        }
        next(err);
    }
};

exports.uploadBankSlip = async (req, res, next) => {
    try {
        if (!req.user || !req.user.UserID) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { bookingId } = req.body;
        const userId = req.user.UserID;

        if (!bookingId) {
            return res.status(400).json({ message: "Missing booking ID" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Bank slip file is required" });
        }

        const slipUrl = req.file.path;

        const result = await paymentService.processBankSlip(userId, bookingId, slipUrl);
        res.json(result);

    } catch (err) {
        if (err.message === "Booking not found or not pending payment") {
            return res.status(404).json({ message: err.message });
        }
        next(err);
    }
};