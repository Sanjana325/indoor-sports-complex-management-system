const { pool } = require("../../config/db");

// Get all payments for admin
exports.listPayments = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.PaymentID, p.Amount, p.Method, p.SlipPath, p.Status, p.PaidAt,
                    u.FirstName, u.LastName,
                    bp.BookingPaymentID, bp.BookingID,
                    emp.EnrollmentMonthPaymentID
             FROM payment p
             JOIN useraccount u ON p.UserID = u.UserID
             LEFT JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID
             LEFT JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID
             ORDER BY p.PaidAt DESC`
        );
        console.log("FIRST ROW OUT:", rows[0]);

        const payments = rows.map(r => ({
            id: `PAY${String(r.PaymentID).padStart(3, '0')}`,
            paymentIdStr: String(r.PaymentID),
            name: `${r.FirstName} ${r.LastName}`,
            bookingId: r.BookingID || null,
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
        const [payRes] = await connection.query("SELECT * FROM payment WHERE PaymentID = ?", [paymentId]);
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

        // 2. Determine type and update linked entity
        const [bp] = await connection.query("SELECT BookingID FROM bookingpayment WHERE PaymentID = ?", [paymentId]);
        if (bp.length > 0) {
            const bookingId = bp[0].BookingID;
            await connection.query("UPDATE booking SET Status = 'CONFIRMED' WHERE BookingID = ?", [bookingId]);
        } else {
            const [emp] = await connection.query("SELECT EnrollmentMonthID FROM enrollmentmonthpayment WHERE PaymentID = ?", [paymentId]);
            if (emp.length > 0) {
                const monthId = emp[0].EnrollmentMonthID;
                await connection.query("UPDATE enrollmentmonth SET Status = 'PAID' WHERE EnrollmentMonthID = ?", [monthId]);
            }
        }

        await connection.commit();
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
        const [payRes] = await connection.query("SELECT * FROM payment WHERE PaymentID = ?", [paymentId]);
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

        // 2. Determine type and update linked entity
        const [bp] = await connection.query("SELECT BookingID FROM bookingpayment WHERE PaymentID = ?", [paymentId]);
        if (bp.length > 0) {
            const bookingId = bp[0].BookingID;
            // Complete cancel of the booking
            await connection.query("UPDATE booking SET Status = 'CANCELLED' WHERE BookingID = ?", [bookingId]);
        } else {
            // For class fees, the user requested not to kick them out entirely, 
            // so we'll just leave them enrolled and leave the month as DUE or set to CANCELLED. 
            // We can leave the month status as DUE so they must try again, 
            // or we could mark that specific month attempt as CANCELLED. 
            // Let's mark the month as DUE to allow another payment try, 
            // but the frontend/backend will block duplicate attempts if not careful.
            // Wait, processBankSlip handles creating another payment.
            // The cleanest approach without kicking them out is to just leave enrollment alone, 
            // but the specific payment record is REJECTED. 
            // We can perhaps keep EnrollmentMonth 'DUE' so they can try exactly that month again.
            const [emp] = await connection.query("SELECT EnrollmentMonthID FROM enrollmentmonthpayment WHERE PaymentID = ?", [paymentId]);
            if (emp.length > 0) {
               const monthId = emp[0].EnrollmentMonthID;
               // We ensure it stays DUE but is no longer linked to an active pending payment process 
               // (the payment is rejected, so it's not pending anymore).
               await connection.query("UPDATE enrollmentmonth SET Status = 'DUE' WHERE EnrollmentMonthID = ?", [monthId]);
            }
        }

        await connection.commit();
        res.json({ message: "Payment rejected successfully" });
    } catch (err) {
        if (connection) await connection.rollback();
        next(err);
    } finally {
        if (connection) connection.release();
    }
};
