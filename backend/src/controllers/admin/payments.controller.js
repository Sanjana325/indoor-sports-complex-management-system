const { pool } = require("../../config/db");
const paymentModel = require("../../models/payment.model");
const emailService = require("../../services/email.service");

// get the number of payments waiting for approval
exports.getPendingCount = async (req, res, next) => {
    try {
        const count = await paymentModel.getPendingCount();
        res.json({ count });
    } catch (err) {
        next(err);
    }
};

// get a list of all payments with details
exports.listPayments = async (req, res, next) => {
    try {
        // fetch all payment records
        const rows = await paymentModel.findAll();
        // format payment data for display
        const payments = rows.map(r => ({
            id: `PAY-${String(r.PaymentID).padStart(6, '0')}`,
            paymentIdStr: String(r.PaymentID),
            name: `${r.FirstName} ${r.LastName}`,
            bookingId: r.BookingID ? `BKG-${String(r.BookingID).padStart(6, '0')}` : null,
            enrollmentId: r.EnrollmentID ? `ENR-${String(r.EnrollmentID).padStart(6, '0')}` : null,
            type: r.BookingPaymentID ? "Court Booking" : "Class Fee",
            method: r.Method === 'BANK_SLIP' ? "Bank Slip" : "Online",
            amount: Number(r.Amount),
            slip: r.SlipPath || null,
            status: r.Status,
            paidAt: r.PaidAt ? new Date(r.PaidAt).toISOString() : null
        }));
        res.json({ payments });
    } catch (err) {
        next(err);
    }
};

// approve a pending bank slip payment
exports.verifyPayment = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const paymentId = req.params.id;
        // find the payment record
        const payment = await paymentModel.findById(paymentId, conn);
        
        if (!payment) return res.status(404).json({ message: "Payment not found" });
        // check if payment is already processed
        if (payment.Status !== 'PENDING') return res.status(400).json({ message: "Only PENDING payments can be verified" });

        // start database transaction to update status
        await conn.beginTransaction();
        const { targetName, isClass } = await paymentModel.verify(paymentId, conn);
        await conn.commit();

        // send confirmation email to the user
        if (payment.Email && targetName) {
            emailService.sendPaymentConfirmationEmail({
                toEmail: payment.Email,
                toName: `${payment.FirstName} ${payment.LastName}`.trim(),
                targetName,
                amount: payment.Amount,
                isClass
            }).catch(e => console.error("Email failed:", e));
        }

        res.json({ message: "Payment verified successfully" });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

// decline a bank slip payment
exports.rejectPayment = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const paymentId = req.params.id;
        const { reason } = req.body;
        
        // find the payment record
        const payment = await paymentModel.findById(paymentId, conn);

        if (!payment) return res.status(404).json({ message: "Payment not found" });
        // check if payment is already processed
        if (payment.Status !== 'PENDING') return res.status(400).json({ message: "Only PENDING payments can be rejected" });

        // start database transaction to reject
        await conn.beginTransaction();
        const { targetName, isClass } = await paymentModel.reject(paymentId, conn);
        await conn.commit();

        // send rejection email to the user
        if (payment.Email && targetName) {
            const emailData = {
                toEmail: payment.Email,
                toName: `${payment.FirstName} ${payment.LastName}`.trim(),
                targetName,
                amount: payment.Amount,
                isClass,
                reason: reason || "Your payment slip could not be verified."
            };

            if (isClass) {
                // For classes, we use the specific enrollment cancellation email which includes the reason
                emailService.sendEnrollmentCancelledEmail({
                    toEmail: emailData.toEmail,
                    toName: emailData.toName,
                    className: targetName,
                    reason: emailData.reason
                }).catch(e => console.error("Class Rejection Email failed:", e));
            } else {
                // For bookings, we use the standard rejection email
                emailService.sendPaymentRejectionEmail(emailData).catch(e => console.error("Booking Rejection Email failed:", e));
            }
        }

        res.json({ message: "Payment rejected successfully" });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

