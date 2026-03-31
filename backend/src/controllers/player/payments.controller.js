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

exports.initiateEnrollmentPayment = async (req, res, next) => {
    try {
        if (!req.user || !req.user.UserID) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { classId } = req.body;
        const userId = req.user.UserID;

        if (!classId) {
            return res.status(400).json({ message: "Missing class ID" });
        }

        const userDetails = {
            FirstName: req.user.FirstName,
            LastName: req.user.LastName,
            Email: req.user.Email,
            PhoneNumber: req.user.PhoneNumber
        };

        const paymentData = await paymentService.createEnrollmentPayment(userId, classId, userDetails);
        res.json(paymentData);

    } catch (err) {
        if (err.message === "Class not found or not active") {
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

        const { bookingId, classId, type } = req.body;
        const userId = req.user.UserID;

        const targetId = type === "CLASS" ? classId : bookingId;

        if (!targetId) {
            return res.status(400).json({ message: `Missing ${type === "CLASS" ? "class" : "booking"} ID` });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Bank slip file is required" });
        }

        const slipUrl = req.file.path;

        const result = await paymentService.processBankSlip(userId, targetId, slipUrl, type);
        res.json(result);

    } catch (err) {
        if (err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }
        next(err);
    }
};