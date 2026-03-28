const { pool } = require("../config/db");
const { generatePaymentHash, verifyNotificationHash } = require("./paymentGateway.service");

// Get user payments
exports.getUserPayments = async (userId) => {
    const [rows] = await pool.query(
        `SELECT PaymentID, Amount, Method, Status, PaidAt, VerifiedAt
         FROM payment
         WHERE UserID = ?
         ORDER BY PaidAt DESC`,
        [userId]
    );
    return rows;
};

// Initiate booking online payment
exports.createOnlinePayment = async (userId, bookingId, userDetails) => {
    let connection;
    try {
        const [bookings] = await pool.query(
            `SELECT b.BookingID, b.StartDateTime, b.EndDateTime, c.PricePerHour
             FROM booking b
             JOIN court c ON b.CourtID = c.CourtID
             WHERE b.BookingID = ? AND b.UserID = ? AND b.Status = 'PENDING_PAYMENT'`,
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            throw new Error("Booking not found or not pending payment");
        }

        const booking = bookings[0];

        const start = new Date(booking.StartDateTime);
        const end = new Date(booking.EndDateTime);
        const durationHours = (end - start) / (1000 * 60 * 60);
        const amount = Number(booking.PricePerHour) * durationHours;

        const formattedAmount = amount.toFixed(2);
        // Use the BookingID as the PayHere order_id instead of inserting a dummy payment
        const hash = generatePaymentHash(String(bookingId), formattedAmount, "LKR");

        return {
            merchant_id: process.env.PAYHERE_MERCHANT_ID,
            order_id: String(bookingId),
            amount: formattedAmount,
            currency: "LKR",
            hash,
            items: `Booking #${bookingId}`,
            customer_details: {
                first_name: userDetails.FirstName || "Player",
                last_name: userDetails.LastName || "",
                email: userDetails.Email || "",
                phone: userDetails.PhoneNumber || ""
            }
        };

    } catch (err) {
        throw err;
    }
};

// Verify PayHere notification
exports.verifyPayHerePayment = async (body) => {
    let connection;
    try {
        const { order_id, status_code } = body;

        const isValid = verifyNotificationHash(body);
        if (!isValid) {
            throw new Error("Invalid signature");
        }

        if (status_code === '2') {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Fetch booking to calculate amount and get UserID
            const [bookings] = await connection.query(
                `SELECT b.UserID, b.StartDateTime, b.EndDateTime, c.PricePerHour, b.Status 
                 FROM booking b 
                 JOIN court c ON b.CourtID = c.CourtID 
                 WHERE b.BookingID = ?`,
                [order_id]
            );

            if (bookings.length > 0 && bookings[0].Status === 'PENDING_PAYMENT') {
                const booking = bookings[0];
                const start = new Date(booking.StartDateTime);
                const end = new Date(booking.EndDateTime);
                const durationHours = (end - start) / (1000 * 60 * 60);
                const amount = Number(booking.PricePerHour) * durationHours;

                // 2. Insert the officially verified online payment record
                const [payRes] = await connection.query(
                    "INSERT INTO payment (UserID, Amount, Method, Status, PaidAt, VerifiedAt) VALUES (?, ?, 'ONLINE', 'VERIFIED', NOW(), NOW())",
                    [booking.UserID, amount]
                );

                // 3. Link it
                await connection.query(
                    "INSERT INTO bookingpayment (PaymentID, BookingID) VALUES (?, ?)",
                    [payRes.insertId, order_id]
                );

                // 4. Confirm the booking
                await connection.query(
                    "UPDATE booking SET Status = 'CONFIRMED' WHERE BookingID = ?",
                    [order_id]
                );
            }

            await connection.commit();
        }
        
        return "OK";
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection && connection.release) {
            connection.release();
        }
    }
};

// Process bank slip upload
exports.processBankSlip = async (userId, bookingId, slipUrl) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Calculate amount to store in payment table
        const [bookings] = await connection.query(
            `SELECT b.BookingID, b.StartDateTime, b.EndDateTime, c.PricePerHour
             FROM booking b
             JOIN court c ON b.CourtID = c.CourtID
             WHERE b.BookingID = ? AND b.UserID = ? AND b.Status = 'PENDING_PAYMENT'`,
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            connection.release();
            throw new Error("Booking not found or not pending payment");
        }

        const booking = bookings[0];

        const start = new Date(booking.StartDateTime);
        const end = new Date(booking.EndDateTime);
        const durationHours = (end - start) / (1000 * 60 * 60);
        const amount = Number(booking.PricePerHour) * durationHours;

        await connection.beginTransaction();

        const [payRes] = await connection.query(
            "INSERT INTO payment (UserID, Amount, Method, SlipPath, Status) VALUES (?, ?, 'BANK_SLIP', ?, 'PENDING')",
            [userId, amount, slipUrl]
        );

        const paymentId = payRes.insertId;

        await connection.query(
            "INSERT INTO bookingpayment (PaymentID, BookingID) VALUES (?, ?)",
            [paymentId, bookingId]
        );

        await connection.query(
            "UPDATE booking SET Status = 'WAITING_VERIFICATION' WHERE BookingID = ?",
            [bookingId]
        );

        await connection.commit();

        return {
            message: "Bank slip uploaded successfully",
            paymentId: paymentId
        };

    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection && connection.release) {
            connection.release();
        }
    }
};
