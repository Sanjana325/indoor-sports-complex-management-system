const paymentService = require("../../services/payment.service");

// get payment history for the current player
exports.getMyPayments = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const payments = await paymentService.getUserPayments(userId);
        res.json({ payments });
    } catch (err) {
        next(err);
    }
};

// start online payment process for a court booking
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

        // request gateway data from service
        const paymentData = await paymentService.createOnlinePayment(userId, bookingId, userDetails);
        res.json(paymentData);

    } catch (err) {
        if (err.message === "Booking not found or not pending payment") {
            return res.status(404).json({ message: err.message });
        }
        next(err);
    }
};

// start online payment process for a class enrollment
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

        // request gateway data from service
        const paymentData = await paymentService.createEnrollmentPayment(userId, classId, userDetails);
        res.json(paymentData);

    } catch (err) {
        if (err.message === "Class not found or not active") {
            return res.status(404).json({ message: err.message });
        }
        next(err);
    }
};

// handle payment success notifications from PayHere gateway
exports.handlePayHereNotify = async (req, res, next) => {
    try {
        // verify signature to prevent fake notifications
        await paymentService.verifyPayHerePayment(req.body);
        res.send("OK");
    } catch (err) {
        if (err.message === "Invalid signature") {
            return res.status(400).send("Invalid signature");
        }
        next(err);
    }
};

// submit a bank deposit slip for manual verification
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

        // get the uploaded file path from Cloudinary/Multer
        const slipUrl = req.file.path;

        // link slip to the booking or class enrollment
        const result = await paymentService.processBankSlip(userId, targetId, slipUrl, type);
        res.json(result);

    } catch (err) {
        if (err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }
        next(err);
    }
};