const { pool } = require("../../config/db");
const { generatePaymentHash, verifyNotificationHash } = require("../../utils/payhere");

exports.getMyPayments = async (req, res, next) => {
    try {
        const userId = req.user.userId;

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
        const { bookingId } = req.body;
        const userId = req.user.userId;

        if (!bookingId) {
            return res.status(400).json({ message: "Missing booking ID" });
        }

        // 1. Verify booking belongs to player and get details (including price)
        const [bookings] = await pool.query(
            `SELECT b.BookingID, b.StartDateTime, b.EndDateTime, c.PricePerHour
             FROM booking b
             JOIN court c ON b.CourtID = c.CourtID
             WHERE b.BookingID = ? AND b.UserID = ? AND b.Status = 'PENDING'`,
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ message: "Pending booking not found" });
        }

        const booking = bookings[0];

        // 2. Calculate amount
        const start = new Date(booking.StartDateTime);
        const end = new Date(booking.EndDateTime);
        const durationHours = (end - start) / (1000 * 60 * 60);
        const amount = Number(booking.PricePerHour) * durationHours;

        if (amount <= 0) {
            return res.status(400).json({ message: "Invalid booking duration or price" });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 3. Create payment record
        const [payRes] = await connection.query(
            "INSERT INTO payment (UserID, Amount, Method, Status) VALUES (?, ?, 'ONLINE', 'PENDING')",
            [userId, amount]
        );
        const paymentId = payRes.insertId;

        // 4. Create bookingpayment record
        await connection.query(
            "INSERT INTO bookingpayment (PaymentID, BookingID) VALUES (?, ?)",
            [paymentId, bookingId]
        );

        await connection.commit();

        // 5. Generate PayHere payload
        const formattedAmount = amount.toFixed(2);
        const hash = generatePaymentHash(paymentId, formattedAmount, "LKR");

        res.status(200).json({
            merchant_id: process.env.PAYHERE_MERCHANT_ID,
            order_id: paymentId,
            amount: formattedAmount,
            currency: "LKR",
            hash: hash,
            items: `Booking #${bookingId}`,
            customer_details: {
                first_name: req.user.firstName || "Player",
                last_name: req.user.lastName || "",
                email: req.user.email || "",
                phone: req.user.phoneNumber || ""
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
        const {
            order_id,
            status_code
        } = req.body;

        // 1. Verify Hash
        const isValid = verifyNotificationHash(req.body);
        if (!isValid) {
            console.error("Invalid PayHere Notification Hash");
            return res.status(400).json({ message: "Invalid signature" });
        }

        // 2. Process Successful Payment (status_code 2)
        if (status_code == '2') {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 3. Update Payment Table
            const [updatePayRes] = await connection.query(
                `UPDATE payment 
                 SET Status = 'VERIFIED', PaidAt = NOW(), VerifiedAt = NOW() 
                 WHERE PaymentID = ? AND Status != 'VERIFIED'`,
                [order_id]
            );

            if (updatePayRes.affectedRows > 0) {
                // 4. Find and Update related booking
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
        } else {
            console.log(`PayHere Notification: Status code ${status_code} for Order ${order_id}`);
        }

        res.status(200).send("OK");
    } catch (err) {
        if (connection) await connection.rollback();
        next(err);
    } finally {
        if (connection) connection.release();
    }
};
