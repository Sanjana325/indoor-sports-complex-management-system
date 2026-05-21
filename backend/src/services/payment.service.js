const { pool } = require("../config/db");
const { generatePaymentHash, verifyNotificationHash } = require("./paymentGateway.service");
const paymentModel = require("../models/payment.model");
const bookingModel = require("../models/booking.model");
const classModel = require("../models/class.model");
const enrollmentModel = require("../models/enrollment.model");
const userModel = require("../models/user.model");
const emailService = require("./email.service");

// get all payments for a specific user
exports.getUserPayments = async (userId) => {
    // fetch payments from database
    return await paymentModel.findByUserId(userId);
};

// start online payment process for a booking
exports.createOnlinePayment = async (userId, bookingId, userDetails) => {
    // check if booking exists and needs payment
    const booking = await bookingModel.getBookingWithPrice(bookingId, userId);
    if (!booking || booking.Status !== 'PENDING_PAYMENT') {
        throw new Error("Booking not found or not pending payment");
    }

    // calculate total amount based on duration
    const start = new Date(booking.StartDateTime);
    const end = new Date(booking.EndDateTime);
    const durationHours = (end - start) / (1000 * 60 * 60);
    const amount = Number(booking.PricePerHour) * durationHours;

    // generate secure hash for payment gateway
    const formattedAmount = amount.toFixed(2);
    const hash = generatePaymentHash(String(bookingId), formattedAmount, "LKR");

    // return payment parameters for frontend
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
};

// start online payment process for a class enrollment
exports.createEnrollmentPayment = async (userId, classId, userDetails) => {
    // check if class exists and is active
    const cls = await classModel.findById(classId);
    if (!cls || cls.Status !== 'ACTIVE') {
        throw new Error("Class not found or not active");
    }

    // generate unique order id and hash
    const formattedAmount = Number(cls.Fee).toFixed(2);
    const orderId = `ENR-${cls.ClassID}-${userId}-${Date.now()}`;
    const hash = generatePaymentHash(orderId, formattedAmount, "LKR");

    // return payment parameters for frontend
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
};

// handle payment notification from payhere gateway
exports.verifyPayHerePayment = async (body) => {
    let connection;
    try {
        const { order_id, status_code, payhere_amount } = body;
        console.log(`[PayHere Notify] Received for Order: ${order_id}, Status: ${status_code}`);

        // validate hash signature
        const isValid = verifyNotificationHash(body);
        if (!isValid) {
            console.error(`[PayHere Notify] Invalid hash signature for Order: ${order_id}`);
            throw new Error("Invalid signature");
        }

        // status '2' means payment is successful (PayHere sends it as a string or number)
        if (String(status_code) === '2') {
            // start database transaction
            connection = await pool.getConnection();
            await connection.beginTransaction();

            if (order_id.startsWith('ENR-')) {
                // handle class enrollment payment
                const parts = order_id.split('-');
                const classId = Number(parts[1]);
                const userId = Number(parts[2]);
                const amount = Number(payhere_amount);

                const cls = await classModel.findById(classId, connection);
                if (cls) {
                    // update enrollment and payment records
                    const enrollmentId = await enrollmentModel.create({ classId, userId, status: 'ENROLLED' }, connection);
                    const paymentId = await paymentModel.create({ userId, amount, method: 'ONLINE', status: 'VERIFIED', verifiedAt: new Date() }, connection);
                    const monthId = await enrollmentModel.createMonth({ enrollmentId, periodMonth: new Date(), feeAmount: amount, status: 'PAID' }, connection);
                    await paymentModel.linkEnrollmentMonth(paymentId, monthId, connection);

                    // send confirmation email
                    const user = await userModel.findById(userId);
                    if (user && user.Email) {
                        emailService.sendPaymentConfirmationEmail({
                            toEmail: user.Email,
                            toName: `${user.FirstName} ${user.LastName}`.trim(),
                            targetName: cls.Title,
                            amount: amount,
                            isClass: true
                        }).catch(e => console.error("Email failed:", e));
                    }
                }
            } else {
                // handle court booking payment
                const booking = await bookingModel.getBookingWithPrice(order_id, null, connection);
                if (booking && booking.Status === 'PENDING_PAYMENT') {
                    const start = new Date(booking.StartDateTime);
                    const end = new Date(booking.EndDateTime);
                    const durationHours = (end - start) / (1000 * 60 * 60);
                    const amount = Number(booking.PricePerHour) * durationHours;

                    // update booking and payment records
                    const paymentId = await paymentModel.create({ userId: booking.UserID, amount, method: 'ONLINE', status: 'VERIFIED', verifiedAt: new Date() }, connection);
                    await paymentModel.linkBooking(paymentId, order_id, connection);
                    await bookingModel.updateStatus(order_id, 'CONFIRMED', null, connection);

                    // send confirmation email
                    const user = await userModel.findById(booking.UserID);
                    if (user && user.Email) {
                        emailService.sendPaymentConfirmationEmail({
                            toEmail: user.Email,
                            toName: `${user.FirstName} ${user.LastName}`.trim(),
                            targetName: booking.CourtName,
                            amount: amount,
                            isClass: false
                        }).catch(e => console.error("Email failed:", e));
                    }
                }
            }

            // commit database changes
            await connection.commit();
        }
        return "OK";
    } catch (err) {
        // rollback on error
        if (connection) await connection.rollback();
        throw err;
    } finally {
        // release connection
        if (connection) connection.release();
    }
};

// handle manual bank slip upload for verification
exports.processBankSlip = async (userId, targetId, slipUrl, type = "BOOKING") => {
    let connection;
    try {
        connection = await pool.getConnection();
        let amount = 0;
        let itemName = "";

        // check target record and get amount
        if (type === "CLASS") {
            const cls = await classModel.findById(targetId, connection);
            if (!cls || cls.Status !== 'ACTIVE') throw new Error("Class not found or not active");
            amount = Number(cls.Fee);
            itemName = cls.Title;
        } else {
            const booking = await bookingModel.getBookingWithPrice(targetId, userId, connection);
            if (!booking || booking.Status !== 'PENDING_PAYMENT') throw new Error("Booking not found or not pending payment");
            
            const durationHours = (new Date(booking.EndDateTime) - new Date(booking.StartDateTime)) / (1000 * 60 * 60);
            amount = Number(booking.PricePerHour) * durationHours;
            itemName = booking.CourtName;
        }

        // start database transaction
        await connection.beginTransaction();

        // create pending payment record
        const paymentId = await paymentModel.create({ userId, amount, method: 'BANK_SLIP', slipPath: slipUrl, status: 'PENDING' }, connection);

        // link payment to target record
        if (type === "CLASS") {
            const enrollmentId = await enrollmentModel.create({ classId: targetId, userId, status: 'PENDING' }, connection);
            const monthId = await enrollmentModel.createMonth({ enrollmentId, periodMonth: new Date(), feeAmount: amount, status: 'DUE' }, connection);
            await paymentModel.linkEnrollmentMonth(paymentId, monthId, connection);
        } else {
            await paymentModel.linkBooking(paymentId, targetId, connection);
            await bookingModel.updateStatus(targetId, 'WAITING_VERIFICATION');
        }

        // commit database changes
        await connection.commit();

        // send notification email
        const user = await userModel.findById(userId);
        if (user && user.Email) {
            emailService.sendSlipPendingEmail({
                toEmail: user.Email,
                toName: `${user.FirstName} ${user.LastName}`.trim(),
                targetName: itemName,
                amount: amount,
                isClass: type === "CLASS"
            }).catch(e => console.error("Email failed:", e));
        }

        return { message: "Bank slip uploaded successfully", paymentId };

    } catch (err) {
        // rollback on error
        if (connection) await connection.rollback();
        throw err;
    } finally {
        // release connection
        if (connection) connection.release();
    }
};

