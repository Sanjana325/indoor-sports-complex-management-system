const { pool } = require("../../config/db");
const { generatePaymentHash, verifyNotificationHash } = require("../../utils/payhere");

exports.getMyPayments = async (req, res, next) => {
    try {
        const userId = req.user.UserID;

        const [rows] = await pool.query(
            `SELECT PaymentID, Amount, Method, Status, PaidAt, VerifiedAt
             FROM payment
             WHERE UserID = ?
             ORDER BY PaidAt DESC`,
            [userId]
        );

        res.json({ payments: rows });
    } catch (err) {
        next(err);
    }
};

exports.initiateBookingPayment = async (req, res, next) => {
    let connection;
    try {
        if (!req.user || !req.user.UserID) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { bookingId } = req.body;
        const userId = req.user.UserID;

        if (!bookingId) {
            return res.status(400).json({ message: "Missing booking ID" });
        }

        const [bookings] = await pool.query(
            `SELECT b.BookingID, b.StartDateTime, b.EndDateTime, c.PricePerHour
             FROM booking b
             JOIN court c ON b.CourtID = c.CourtID
             WHERE b.BookingID = ? AND b.UserID = ? AND b.Status = 'PENDING_PAYMENT'`,
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = bookings[0];

        const start = new Date(booking.StartDateTime);
        const end = new Date(booking.EndDateTime);
        const durationHours = (end - start) / (1000 * 60 * 60);
        const amount = Number(booking.PricePerHour) * durationHours;

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [payRes] = await connection.query(
            "INSERT INTO payment (UserID, Amount, Method, Status) VALUES (?, ?, 'ONLINE', 'PENDING')",
            [userId, amount]
        );

        const paymentId = payRes.insertId;

        await connection.query(
            "INSERT INTO bookingpayment (PaymentID, BookingID) VALUES (?, ?)",
            [paymentId, bookingId]
        );

        await connection.commit();

        const formattedAmount = amount.toFixed(2);
        const hash = generatePaymentHash(String(paymentId), formattedAmount, "LKR");

        res.json({
            merchant_id: process.env.PAYHERE_MERCHANT_ID,
            order_id: String(paymentId),
            amount: formattedAmount,
            currency: "LKR",
            hash,
            items: `Booking #${bookingId}`,
            customer_details: {
                first_name: req.user.FirstName || "Player",
                last_name: req.user.LastName || "",
                email: req.user.Email || "",
                phone: req.user.PhoneNumber || ""
            }
        });

    } catch (err) {
        if (connection) await connection.rollback();
        next(err);
    } finally {
        if (connection) connection.release();
    }
};

exports.handlePayHereNotify = async (req, res, next) => {
    let connection;
    try {
        const { order_id, status_code } = req.body;

        const isValid = verifyNotificationHash(req.body);
        if (!isValid) {
            return res.status(400).send("Invalid signature");
        }

        if (status_code === '2') {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const [updatePayRes] = await connection.query(
                `UPDATE payment 
                 SET Status = 'VERIFIED', PaidAt = NOW(), VerifiedAt = NOW()
                 WHERE PaymentID = ? AND Status != 'VERIFIED'`,
                [order_id]
            );

            if (updatePayRes.affectedRows > 0) {
                const [links] = await connection.query(
                    "SELECT BookingID FROM bookingpayment WHERE PaymentID = ?",
                    [order_id]
                );

                if (links.length > 0) {
                    await connection.query(
                        "UPDATE booking SET Status = 'CONFIRMED' WHERE BookingID = ?",
                        [links[0].BookingID]
                    );
                }
            }

            await connection.commit();
        }

        res.send("OK");
    } catch (err) {
        if (connection) await connection.rollback();
        next(err);
    } finally {
        if (connection) connection.release();
    }
};