const { pool } = require("../config/db");

// get a comprehensive list of all transactions with related booking or class details
async function findAll(conn = pool) {
    const [rows] = await conn.query(`
        SELECT p.PaymentID, p.Amount, p.Method, p.SlipPath, p.Status, p.PaidAt,
               u.FirstName, u.LastName, u.Email,
               bp.BookingPaymentID, bp.BookingID,
               emp.EnrollmentMonthPaymentID, e.EnrollmentID,
               em.EnrollmentMonthID, c.Title as ClassTitle, ct.CourtName
        FROM payment p
        JOIN useraccount u ON p.UserID = u.UserID
        LEFT JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID
        LEFT JOIN booking b ON bp.BookingID = b.BookingID
        LEFT JOIN court ct ON b.CourtID = ct.CourtID
        LEFT JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID
        LEFT JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
        LEFT JOIN enrollment e ON em.EnrollmentID = e.EnrollmentID
        LEFT JOIN class c ON e.ClassID = c.ClassID
        ORDER BY CASE WHEN p.Status = 'PENDING' THEN 1 ELSE 2 END ASC, p.PaidAt DESC
    `);
    return rows;
}

// get specific payment details with payer info
async function findById(paymentId, conn = pool) {
    const [rows] = await conn.query(`
        SELECT p.*, u.Email, u.FirstName, u.LastName 
        FROM payment p 
        JOIN useraccount u ON p.UserID = u.UserID 
        WHERE p.PaymentID = ?`, [paymentId]);
    return rows.length ? rows[0] : null;
}

// get total number of payments awaiting manual verification
async function getPendingCount() {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM payment WHERE Status = 'PENDING'");
    return rows[0].count;
}

// record a new transaction (online or bank slip upload)
async function create({ userId, amount, method, slipPath, status, paidAt, verifiedAt }, conn = pool) {
    const [result] = await conn.query(
        "INSERT INTO payment (UserID, Amount, Method, SlipPath, Status, PaidAt, VerifiedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userId, amount, method, slipPath || null, status || 'PENDING', paidAt || new Date(), verifiedAt || null]
    );
    return result.insertId;
}

// confirm a payment and automatically activate the related booking or enrollment
async function verify(paymentId, conn) {
    // 1. update payment record
    await conn.query(
        "UPDATE payment SET Status = 'VERIFIED', VerifiedAt = NOW() WHERE PaymentID = ?",
        [paymentId]
    );

    // 2. sync with booking and confirm it
    const [bp] = await conn.query(`
        SELECT bp.BookingID, c.CourtName 
        FROM bookingpayment bp
        JOIN booking b ON bp.BookingID = b.BookingID
        JOIN court c ON b.CourtID = c.CourtID
        WHERE bp.PaymentID = ?`, [paymentId]);

    if (bp.length > 0) {
        await conn.query("UPDATE booking SET Status = 'CONFIRMED' WHERE BookingID = ?", [bp[0].BookingID]);
        return { targetName: bp[0].CourtName, isClass: false };
    }

    // 3. sync with enrollment month and mark it as paid
    const [emp] = await conn.query(`
        SELECT emp.EnrollmentMonthID, c.Title 
        FROM enrollmentmonthpayment emp
        JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
        JOIN enrollment e ON em.EnrollmentID = e.EnrollmentID
        JOIN class c ON e.ClassID = c.ClassID
        WHERE emp.PaymentID = ?`, [paymentId]);

    if (emp.length > 0) {
        await conn.query("UPDATE enrollmentmonth SET Status = 'PAID' WHERE EnrollmentMonthID = ?", [emp[0].EnrollmentMonthID]);
        // Also ensure the enrollment itself is marked as active
        await conn.query(`
            UPDATE enrollment e
            JOIN enrollmentmonth em ON e.EnrollmentID = em.EnrollmentID
            SET e.Status = 'ENROLLED'
            WHERE em.EnrollmentMonthID = ?`, [emp[0].EnrollmentMonthID]);
        return { targetName: emp[0].Title, isClass: true };
    }

    return { targetName: null, isClass: false };
}

// mark a payment as invalid and cancel/revert the associated booking or fee status
async function reject(paymentId, conn) {
    // 1. update payment record
    await conn.query(
        "UPDATE payment SET Status = 'REJECTED', VerifiedAt = NOW() WHERE PaymentID = ?",
        [paymentId]
    );

    // 2. revert booking to cancelled
    const [bp] = await conn.query(`
        SELECT bp.BookingID, c.CourtName 
        FROM bookingpayment bp
        JOIN booking b ON bp.BookingID = b.BookingID
        JOIN court c ON b.CourtID = c.CourtID
        WHERE bp.PaymentID = ?`, [paymentId]);

    if (bp.length > 0) {
        await conn.query("UPDATE booking SET Status = 'CANCELLED' WHERE BookingID = ?", [bp[0].BookingID]);
        return { targetName: bp[0].CourtName, isClass: false };
    }

    // 3. revert enrollment month back to due
    const [emp] = await conn.query(`
        SELECT emp.EnrollmentMonthID, c.Title 
        FROM enrollmentmonthpayment emp
        JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
        JOIN enrollment e ON em.EnrollmentID = e.EnrollmentID
        JOIN class c ON e.ClassID = c.ClassID
        WHERE emp.PaymentID = ?`, [paymentId]);

    if (emp.length > 0) {
        // Revert enrollment month and cancel the main enrollment
        await conn.query("UPDATE enrollmentmonth SET Status = 'DUE' WHERE EnrollmentMonthID = ?", [emp[0].EnrollmentMonthID]);
        
        await conn.query(`
            UPDATE enrollment e
            JOIN enrollmentmonth em ON e.EnrollmentID = em.EnrollmentID
            SET e.Status = 'CANCELLED'
            WHERE em.EnrollmentMonthID = ?`, [emp[0].EnrollmentMonthID]);

        return { targetName: emp[0].Title, isClass: true };
    }

    return { targetName: null, isClass: false };
}

// create the link between a payment and a court booking
async function linkBooking(paymentId, bookingId, conn = pool) {
    await conn.query("INSERT INTO bookingpayment (PaymentID, BookingID) VALUES (?, ?)", [paymentId, bookingId]);
}

// create the link between a payment and a specific month's class fee
async function linkEnrollmentMonth(paymentId, monthId, conn = pool) {
    await conn.query("INSERT INTO enrollmentmonthpayment (PaymentID, EnrollmentMonthID) VALUES (?, ?)", [paymentId, monthId]);
}

// get payment history for a specific player
async function findByUserId(userId) {
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
}

module.exports = {
    findAll,
    findById,
    getPendingCount,
    create,
    verify,
    reject,
    linkBooking,
    linkEnrollmentMonth,
    findByUserId
};

