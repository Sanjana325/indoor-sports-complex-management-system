const { pool } = require("../config/db");
const { generatePaymentHash, verifyNotificationHash } = require("./paymentGateway.service");

// Get user payments
exports.getUserPayments = async (userId) => {
    const [rows] = await pool.query(
        `SELECT p.PaymentID, p.Amount, p.Method, p.Status, p.PaidAt, p.VerifiedAt, p.SlipPath,
                bp.BookingID,
                c.Title as ClassTitle
         FROM payment p
         LEFT JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID
         LEFT JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID
         LEFT JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
         LEFT JOIN enrollment e ON em.EnrollmentID = e.EnrollmentID
         LEFT JOIN class c ON e.ClassID = c.ClassID
         WHERE p.UserID = ?
         ORDER BY p.PaidAt DESC`,
        [userId]
    );
    return rows;
};

// Initiate booking online payment
exports.createOnlinePayment = async (userId, bookingId, userDetails) => {
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

// Initiate class enrollment online payment
exports.createEnrollmentPayment = async (userId, classId, userDetails) => {
    try {
        const [classes] = await pool.query(
            `SELECT ClassID, Title, Fee FROM class WHERE ClassID = ? AND Status = 'ACTIVE'`,
            [classId]
        );

        if (classes.length === 0) {
            throw new Error("Class not found or not active");
        }

        const cls = classes[0];
        const formattedAmount = Number(cls.Fee).toFixed(2);

        // Generate a unique order_id for enrollment
        const orderId = `ENR-${cls.ClassID}-${userId}-${Date.now()}`;
        const hash = generatePaymentHash(orderId, formattedAmount, "LKR");

        return {
            merchant_id: process.env.PAYHERE_MERCHANT_ID,
            order_id: orderId,
            amount: formattedAmount,
            currency: "LKR",
            hash,
            items: `Enrollment: ${cls.Title}`,
            customer_details: {
                first_name: userDetails.FirstName || "Player",
                last_name: userDetails.LastName || "",
                email: userDetails.Email || "",
                phone: userDetails.PhoneNumber || ""
            },
            custom_1: String(cls.ClassID),
            custom_2: String(userId)
        };
    } catch (err) {
        throw err;
    }
};

// Verify PayHere notification
exports.verifyPayHerePayment = async (body) => {
    let connection;
    try {
        const { order_id, status_code, payhere_amount } = body;
        console.log(`[PayHere Notify] Received for Order: ${order_id}, Status: ${status_code}`);

        const isValid = verifyNotificationHash(body);
        if (!isValid) {
            console.error(`[PayHere Notify] Invalid hash signature for Order: ${order_id}`);
            throw new Error("Invalid signature");
        }

        if (status_code === '2') {
            console.log(`[PayHere Notify] Success! Processing enrollment for: ${order_id}`);
            connection = await pool.getConnection();
            await connection.beginTransaction();

            if (order_id.startsWith('ENR-')) {
                // CLASS ENROLLMENT PAYMENT
                const parts = order_id.split('-');
                const classId = Number(parts[1]);
                const userId = Number(parts[2]);
                const amount = Number(payhere_amount);

                // 1. Double check class exists
                const [cls] = await connection.query("SELECT Fee FROM class WHERE ClassID = ?", [classId]);
                if (cls.length > 0) {
                    // 2. Create enrollment
                    const [enrRes] = await connection.query(
                        `INSERT INTO enrollment (ClassID, UserID, Status) 
                         VALUES (?, ?, 'ENROLLED') 
                         ON DUPLICATE KEY UPDATE Status = 'ENROLLED'`,
                        [classId, userId]
                    );

                    // Get the enrollment ID (either from insert or existing)
                    let enrollmentId;
                    if (enrRes.insertId) {
                        enrollmentId = enrRes.insertId;
                    } else {
                        const [existingEnr] = await connection.query(
                            "SELECT EnrollmentID FROM enrollment WHERE ClassID = ? AND UserID = ?",
                            [classId, userId]
                        );
                        enrollmentId = existingEnr[0].EnrollmentID;
                    }

                    // 3. Create payment record
                    const [payRes] = await connection.query(
                        "INSERT INTO payment (UserID, Amount, Method, Status, PaidAt, VerifiedAt) VALUES (?, ?, 'ONLINE', 'VERIFIED', NOW(), NOW())",
                        [userId, amount]
                    );

                    // 4. Create cycle (enrollmentmonth)
                    const [enmRes] = await connection.query(
                        "INSERT INTO enrollmentmonth (EnrollmentID, PeriodMonth, FeeAmount, Status) VALUES (?, CURDATE(), ?, 'PAID')",
                        [enrollmentId, amount]
                    );

                    // 5. Link them
                    await connection.query(
                        "INSERT INTO enrollmentmonthpayment (PaymentID, EnrollmentMonthID) VALUES (?, ?)",
                        [payRes.insertId, enmRes.insertId]
                    );
                }

            } else {
                // COURT BOOKING PAYMENT
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

                    const [payRes] = await connection.query(
                        "INSERT INTO payment (UserID, Amount, Method, Status, PaidAt, VerifiedAt) VALUES (?, ?, 'ONLINE', 'VERIFIED', NOW(), NOW())",
                        [booking.UserID, amount]
                    );

                    await connection.query(
                        "INSERT INTO bookingpayment (PaymentID, BookingID) VALUES (?, ?)",
                        [payRes.insertId, order_id]
                    );

                    await connection.query(
                        "UPDATE booking SET Status = 'CONFIRMED' WHERE BookingID = ?",
                        [order_id]
                    );
                }
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
exports.processBankSlip = async (userId, targetId, slipUrl, type = "BOOKING") => {
    let connection;
    try {
        connection = await pool.getConnection();
        let amount = 0;

        if (type === "CLASS") {
            const [classes] = await connection.query("SELECT Fee FROM class WHERE ClassID = ? AND Status = 'ACTIVE'", [targetId]);
            if (classes.length === 0) throw new Error("Class not found or not active");
            amount = Number(classes[0].Fee);
        } else {
            const [bookings] = await connection.query(
                `SELECT b.StartDateTime, b.EndDateTime, c.PricePerHour
                 FROM booking b
                 JOIN court c ON b.CourtID = c.CourtID
                 WHERE b.BookingID = ? AND b.UserID = ? AND b.Status = 'PENDING_PAYMENT'`,
                [targetId, userId]
            );
            if (bookings.length === 0) throw new Error("Booking not found or not pending payment");
            
            const booking = bookings[0];
            const durationHours = (new Date(booking.EndDateTime) - new Date(booking.StartDateTime)) / (1000 * 60 * 60);
            amount = Number(booking.PricePerHour) * durationHours;
        }

        await connection.beginTransaction();

        const [payRes] = await connection.query(
            "INSERT INTO payment (UserID, Amount, Method, SlipPath, Status) VALUES (?, ?, 'BANK_SLIP', ?, 'PENDING')",
            [userId, amount, slipUrl]
        );
        const paymentId = payRes.insertId;

        if (type === "CLASS") {
            // Create enrollment with WAITING_VERIFICATION equivalent? 
            // The plan says "PENDING if waiting on admin slip verification"
            const [enrRes] = await connection.query(
                "INSERT INTO enrollment (ClassID, UserID, Status) VALUES (?, ?, 'ENROLLED') ON DUPLICATE KEY UPDATE Status = 'ENROLLED'",
                [targetId, userId]
            );
            
            let enrollmentId;
            if (enrRes.insertId) {
                enrollmentId = enrRes.insertId;
            } else {
                const [[exist]] = await connection.query("SELECT EnrollmentID FROM enrollment WHERE ClassID = ? AND UserID = ?", [targetId, userId]);
                enrollmentId = exist.EnrollmentID;
            }

            const [enmRes] = await connection.query(
                "INSERT INTO enrollmentmonth (EnrollmentID, PeriodMonth, FeeAmount, Status) VALUES (?, CURDATE(), ?, 'DUE')",
                [enrollmentId, amount]
            );

            await connection.query(
                "INSERT INTO enrollmentmonthpayment (PaymentID, EnrollmentMonthID) VALUES (?, ?)",
                [paymentId, enmRes.insertId]
            );
        } else {
            await connection.query("INSERT INTO bookingpayment (PaymentID, BookingID) VALUES (?, ?)", [paymentId, targetId]);
            await connection.query("UPDATE booking SET Status = 'WAITING_VERIFICATION' WHERE BookingID = ?", [targetId]);
        }

        await connection.commit();
        return { message: "Bank slip uploaded successfully", paymentId };

    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

