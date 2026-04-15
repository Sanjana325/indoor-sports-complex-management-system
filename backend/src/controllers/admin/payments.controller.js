const { pool } = require("../../config/db");

// Get pending slip count
exports.getPendingCount = async (req, res, next) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM payment WHERE Status = 'PENDING'");
        res.json({ count: rows[0].count });
    } catch (err) {
        next(err);
    }
};

// Get all payments for admin
exports.listPayments = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.PaymentID, p.Amount, p.Method, p.SlipPath, p.Status, p.PaidAt,
                    u.FirstName, u.LastName,
                    bp.BookingPaymentID, bp.BookingID,
                    emp.EnrollmentMonthPaymentID, e.EnrollmentID
             FROM payment p
             JOIN useraccount u ON p.UserID = u.UserID
             LEFT JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID
             LEFT JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID
             LEFT JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
             LEFT JOIN enrollment e ON em.EnrollmentID = e.EnrollmentID
             ORDER BY CASE WHEN p.Status = 'PENDING' THEN 1 ELSE 2 END ASC, p.PaidAt DESC`
        );
        console.log("FIRST ROW OUT:", rows[0]);

        const payments = rows.map(r => ({
            id: `PAY${String(r.PaymentID).padStart(3, '0')}`,
            paymentIdStr: String(r.PaymentID),
            name: `${r.FirstName} ${r.LastName}`,
            bookingId: r.BookingID || null,
            enrollmentId: r.EnrollmentID || null,
            type: r.BookingPaymentID ? "Court Booking" : "Class Fee",
            method: r.Method === 'BANK_SLIP' ? "Bank Slip" : "Online",
            amount: Number(r.Amount),
            slip: r.SlipPath || null, // Truthy string or null
            status: r.Status,
            paidAt: r.PaidAt ? new Date(r.PaidAt).toISOString() : null
        }));

        res.json({ payments });
    } catch (err) {
        next(err);
    }
};

// Verify a payment
exports.verifyPayment = async (req, res, next) => {
    let connection;
    try {
        const paymentId = req.params.id;
        connection = await pool.getConnection();

        // Check if payment exists
        const [payRes] = await connection.query(`
            SELECT p.*, u.Email, u.FirstName, u.LastName 
            FROM payment p 
            JOIN useraccount u ON p.UserID = u.UserID 
            WHERE p.PaymentID = ?`, [paymentId]);
        if (payRes.length === 0) {
            connection.release();
            return res.status(404).json({ message: "Payment not found" });
        }
        
        const payment = payRes[0];
        if (payment.Status !== 'PENDING') {
            connection.release();
            return res.status(400).json({ message: "Only PENDING payments can be verified" });
        }

        await connection.beginTransaction();

        // 1. Update Payment Status
        await connection.query(
            "UPDATE payment SET Status = 'VERIFIED', VerifiedAt = NOW() WHERE PaymentID = ?",
            [paymentId]
        );

        let targetName = "";
        let isClass = false;

        // 2. Determine type and update linked entity
        const [bp] = await connection.query(`
            SELECT bp.BookingID, c.CourtName 
            FROM bookingpayment bp
            JOIN booking b ON bp.BookingID = b.BookingID
            JOIN court c ON b.CourtID = c.CourtID
            WHERE bp.PaymentID = ?`, [paymentId]);

        if (bp.length > 0) {
            const bookingId = bp[0].BookingID;
            targetName = bp[0].CourtName;
            await connection.query("UPDATE booking SET Status = 'CONFIRMED' WHERE BookingID = ?", [bookingId]);
        } else {
            const [emp] = await connection.query(`
                SELECT emp.EnrollmentMonthID, c.Title 
                FROM enrollmentmonthpayment emp
                JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
                JOIN enrollment e ON em.EnrollmentID = e.EnrollmentID
                JOIN class c ON e.ClassID = c.ClassID
                WHERE emp.PaymentID = ?`, [paymentId]);

            if (emp.length > 0) {
                const monthId = emp[0].EnrollmentMonthID;
                targetName = emp[0].Title;
                isClass = true;
                await connection.query("UPDATE enrollmentmonth SET Status = 'PAID' WHERE EnrollmentMonthID = ?", [monthId]);
            }
        }

        await connection.commit();

        if (payment.Email && targetName) {
            try {
                const emailService = require("../../services/email.service");
                await emailService.sendPaymentConfirmationEmail({
                    toEmail: payment.Email,
                    toName: `${payment.FirstName} ${payment.LastName}`.trim(),
                    targetName,
                    amount: payment.Amount,
                    isClass
                });
            } catch (err) {
                console.error("Failed to send admin verification email:", err);
            }
        }
        res.json({ message: "Payment verified successfully" });
    } catch (err) {
        if (connection) await connection.rollback();
        next(err);
    } finally {
        if (connection) connection.release();
    }
};

// Reject a payment
exports.rejectPayment = async (req, res, next) => {
    let connection;
    try {
        const paymentId = req.params.id;
        connection = await pool.getConnection();

        // Check if payment exists
        const [payRes] = await connection.query(`
            SELECT p.*, u.Email, u.FirstName, u.LastName 
            FROM payment p 
            JOIN useraccount u ON p.UserID = u.UserID 
            WHERE p.PaymentID = ?`, [paymentId]);
        if (payRes.length === 0) {
            connection.release();
            return res.status(404).json({ message: "Payment not found" });
        }
        
        const payment = payRes[0];
        if (payment.Status !== 'PENDING') {
            connection.release();
            return res.status(400).json({ message: "Only PENDING payments can be rejected" });
        }

        await connection.beginTransaction();

        // 1. Update Payment Status to REJECTED
        await connection.query(
            "UPDATE payment SET Status = 'REJECTED', VerifiedAt = NOW() WHERE PaymentID = ?",
            [paymentId]
        );

        let targetName = "";
        let isClass = false;

        // 2. Determine type and update linked entity
        const [bp] = await connection.query(`
            SELECT bp.BookingID, c.CourtName 
            FROM bookingpayment bp
            JOIN booking b ON bp.BookingID = b.BookingID
            JOIN court c ON b.CourtID = c.CourtID
            WHERE bp.PaymentID = ?`, [paymentId]);

        if (bp.length > 0) {
            const bookingId = bp[0].BookingID;
            targetName = bp[0].CourtName;
            // Complete cancel of the booking
            await connection.query("UPDATE booking SET Status = 'CANCELLED' WHERE BookingID = ?", [bookingId]);
        } else {
            const [emp] = await connection.query(`
                SELECT emp.EnrollmentMonthID, c.Title 
                FROM enrollmentmonthpayment emp
                JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
                JOIN enrollment e ON em.EnrollmentID = e.EnrollmentID
                JOIN class c ON e.ClassID = c.ClassID
                WHERE emp.PaymentID = ?`, [paymentId]);

            if (emp.length > 0) {
               const monthId = emp[0].EnrollmentMonthID;
               targetName = emp[0].Title;
               isClass = true;
               // We ensure it stays DUE but is no longer linked to an active pending payment process 
               await connection.query("UPDATE enrollmentmonth SET Status = 'DUE' WHERE EnrollmentMonthID = ?", [monthId]);
            }
        }

        await connection.commit();

        if (payment.Email && targetName) {
            try {
                const emailService = require("../../services/email.service");
                await emailService.sendPaymentRejectionEmail({
                    toEmail: payment.Email,
                    toName: `${payment.FirstName} ${payment.LastName}`.trim(),
                    targetName,
                    amount: payment.Amount,
                    isClass
                });
            } catch (err) {
                console.error("Failed to send admin rejection email:", err);
            }
        }

        res.json({ message: "Payment rejected successfully" });
    } catch (err) {
        if (connection) await connection.rollback();
        next(err);
    } finally {
        if (connection) connection.release();
    }
};
