const { pool } = require("../config/db");

const OPERATING_HOURS_PER_DAY = 16;

// get summary analytics (users, bookings, revenue, classes) for the admin dashboard
async function getDashboardData(start, end) {
    const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];
    
    // basic counts and revenue totals
    const [totalsRows] = await pool.query(`
        SELECT 
            (SELECT COUNT(*) FROM useraccount WHERE Role != 'SUPER_ADMIN') as users,
            (SELECT COUNT(*) FROM booking WHERE StartDateTime >= ? AND StartDateTime <= ? AND Status IN ('CONFIRMED', 'CANCELLED')) as bookings,
            ((SELECT COALESCE(SUM(p.Amount), 0) FROM payment p 
              JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID 
              JOIN booking b ON bp.BookingID = b.BookingID
              WHERE p.Status = 'VERIFIED' AND b.StartDateTime >= ? AND b.StartDateTime <= ?)
             + 
             (SELECT COALESCE(SUM(p.Amount), 0) FROM payment p
              JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID
              JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
              WHERE p.Status = 'VERIFIED' AND em.PeriodMonth >= ? AND em.PeriodMonth <= ?)) as revenue,
            ((SELECT COUNT(*) FROM payment WHERE Status = 'PENDING' AND PaidAt >= ? AND PaidAt <= ?)
             + (SELECT COUNT(*) FROM classsession WHERE Status = 'CANCELLED' AND IsAcknowledged = 0)) as pendingActions,
            (SELECT COUNT(*) FROM class WHERE Status = 'ACTIVE') as classes
    `, [dateFilter[0], dateFilter[1], ...dateFilter, ...dateFilter, ...dateFilter]);

    // calculate combined revenue trend over time
    const [trendRows] = await pool.query(`
        SELECT date, SUM(amount) as total FROM (
            SELECT DATE_FORMAT(b.StartDateTime, '%Y-%m-%d') as date, p.Amount as amount
            FROM payment p JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID JOIN booking b ON bp.BookingID = b.BookingID
            WHERE p.Status = 'VERIFIED' AND b.StartDateTime >= ? AND b.StartDateTime <= ?
            UNION ALL
            SELECT DATE_FORMAT(em.PeriodMonth, '%Y-%m-%d') as date, p.Amount as amount
            FROM payment p JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
            WHERE p.Status = 'VERIFIED' AND em.PeriodMonth >= ? AND em.PeriodMonth <= ?
        ) as combined GROUP BY date ORDER BY date ASC
    `, [...dateFilter, ...dateFilter]);

    // revenue breakdown by sport
    const [sportRows] = await pool.query(`
        SELECT s.SportName as name, s.ColorCode as color, COALESCE(SUM(combined.amount), 0) as value FROM sport s
        LEFT JOIN (
            SELECT b.SportID, p.Amount as amount
            FROM payment p
            JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID
            JOIN booking b ON bp.BookingID = b.BookingID
            WHERE p.Status = 'VERIFIED' AND b.StartDateTime >= ? AND b.StartDateTime <= ?
            UNION ALL
            SELECT cl.SportID, p.Amount as amount
            FROM payment p
            JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID
            JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
            JOIN enrollment e ON em.EnrollmentID = e.EnrollmentID
            JOIN class cl ON e.ClassID = cl.ClassID
            WHERE p.Status = 'VERIFIED' AND em.PeriodMonth >= ? AND em.PeriodMonth <= ?
        ) as combined ON s.SportID = combined.SportID
        GROUP BY s.SportName, s.ColorCode
    `, [...dateFilter, ...dateFilter]);

    // revenue breakdown by court
    const [courtRows] = await pool.query(`
        SELECT c.CourtName as name, COALESCE(SUM(combined.amount), 0) as value,
        (SELECT s.ColorCode FROM court_sport cs JOIN sport s ON cs.SportID = s.SportID WHERE cs.CourtID = c.CourtID LIMIT 1) as color
        FROM court c
        LEFT JOIN (
            SELECT b.CourtID, p.Amount as amount
            FROM payment p
            JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID
            JOIN booking b ON bp.BookingID = b.BookingID
            WHERE p.Status = 'VERIFIED' AND b.StartDateTime >= ? AND b.StartDateTime <= ?
            UNION ALL
            SELECT cc.CourtID, p.Amount as amount
            FROM payment p
            JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID
            JOIN enrollmentmonth em ON emp.EnrollmentMonthID = em.EnrollmentMonthID
            JOIN enrollment e ON em.EnrollmentID = e.EnrollmentID
            JOIN class cl ON e.ClassID = cl.ClassID
            JOIN class_court cc ON cl.ClassID = cc.ClassID
            WHERE p.Status = 'VERIFIED' AND em.PeriodMonth >= ? AND em.PeriodMonth <= ?
        ) as combined ON c.CourtID = combined.CourtID
        GROUP BY c.CourtName, c.CourtID
    `, [...dateFilter, ...dateFilter]);

    return {
        totals: totalsRows[0],
        charts: {
            revenueTrend: trendRows,
            revenueBySport: sportRows,
            revenueByCourt: courtRows
        }
    };
}

// generate detailed booking list and utilization analytics for a date range
async function getBookingsReport(start, end, method) {
    const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];
    let methodCondition = "";
    let methodParams = [...dateFilter];
    
    // filter by payment method if specified
    if (method && method !== 'ALL' && method !== 'undefined') {
        methodCondition = ` AND b.BookingID IN (SELECT bp.BookingID FROM bookingpayment bp JOIN payment pk ON bp.PaymentID = pk.PaymentID WHERE pk.Method = ?)`;
        methodParams.push(method);
    }

    const [rows] = await pool.query(`
        SELECT b.BookingID as id, CONCAT(u.FirstName, ' ', u.LastName) as player, u.PhoneNumber as playerPhone,
               c.CourtName as court, b.StartDateTime as date, b.EndDateTime as endDate, b.CreatedAt as created,
               b.Status, s.SportName, p.PaymentID as paymentId, p.Method as paymentMethod
        FROM booking b JOIN court c ON b.CourtID = c.CourtID JOIN useraccount u ON b.UserID = u.UserID JOIN sport s ON b.SportID = s.SportID
        LEFT JOIN bookingpayment bp ON b.BookingID = bp.BookingID LEFT JOIN payment p ON bp.PaymentID = p.PaymentID
        WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition}
        ORDER BY b.StartDateTime DESC`, methodParams);

    // fetch sub-stats for charts
    const [peakRows] = await pool.query(`SELECT HOUR(b.StartDateTime) as hour, COUNT(*) as count FROM booking b WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition} GROUP BY hour ORDER BY count DESC LIMIT 1`, methodParams);
    const [dailyRows] = await pool.query(`SELECT DATE_FORMAT(b.StartDateTime, '%Y-%m-%d') as date, COUNT(*) as count FROM booking b WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition} GROUP BY date ORDER BY date ASC`, methodParams);
    const [sportRows] = await pool.query(`SELECT s.SportName as name, s.ColorCode as color, COUNT(*) as value FROM booking b JOIN sport s ON b.SportID = s.SportID WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition} GROUP BY s.SportName, s.ColorCode`, methodParams);
    const [kpiRows] = await pool.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN b.Status = 'CONFIRMED' THEN 1 END) as confirmed, COUNT(CASE WHEN b.Status = 'CANCELLED' THEN 1 END) as cancelled FROM booking b WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition}`, methodParams);
    
    // calculate court utilization percentage based on total available hours
    const diffDays = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
    const [[{ count: numCourts }]] = await pool.query('SELECT COUNT(*) as count FROM court');
    const totalAvailableHours = diffDays * numCourts * OPERATING_HOURS_PER_DAY;
    const [[{ totalHours: totalHoursBooked }]] = await pool.query(`SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, b.StartDateTime, b.EndDateTime)) / 60, 0) as totalHours FROM booking b WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? AND b.Status = 'CONFIRMED' ${methodCondition}`, methodParams);

    return {
        rows,
        kpis: { ...kpiRows[0], peakHour: peakRows[0]?.hour, utilization: totalAvailableHours > 0 ? ((totalHoursBooked / totalAvailableHours) * 100).toFixed(1) : 0 },
        charts: { bookingsPerDay: dailyRows, bookingsBySport: sportRows }
    };
}

// generate financial summary and revenue trends by category (classes vs bookings)
async function getPaymentsReport(start, end, category, status) {
    const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];
    let categoryCondition = "";
    let params = [...dateFilter];
    if (category === 'CLASSES') categoryCondition = " AND p.PaymentID IN (SELECT PaymentID FROM enrollmentmonthpayment) ";
    else if (category === 'BOOKINGS') categoryCondition = " AND p.PaymentID IN (SELECT PaymentID FROM bookingpayment) ";

    let statusCondition = "";
    if (status && status !== 'ALL' && status !== 'undefined') {
        statusCondition = " AND p.Status = ? ";
        params.push(status);
    }

    const [rows] = await pool.query(`
        SELECT p.PaymentID as id, CONCAT(u.FirstName, ' ', u.LastName) as name, u.PhoneNumber as phone,
               p.Amount as amount, p.PaidAt as date, p.VerifiedAt as verified, p.Status, p.Method,
               EXISTS(SELECT 1 FROM bookingpayment bp WHERE bp.PaymentID = p.PaymentID) as isBooking
        FROM payment p JOIN useraccount u ON p.UserID = u.UserID 
        WHERE p.PaidAt >= ? AND p.PaidAt <= ? ${categoryCondition} ${statusCondition}
        ORDER BY p.PaidAt DESC`, params);

    const [revenueRows] = await pool.query(`SELECT DATE_FORMAT(p.PaidAt, '%Y-%m-%d') as date, SUM(p.Amount) as total FROM payment p WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED' ${categoryCondition} ${statusCondition} GROUP BY date ORDER BY date ASC`, params);
    const [methodRows] = await pool.query(`SELECT p.Method as name, COUNT(*) as value FROM payment p WHERE p.PaidAt >= ? AND p.PaidAt <= ? ${categoryCondition} ${statusCondition} GROUP BY p.Method`, params);

    // breakdown of revenue predictability (stable class fees vs dynamic bookings)
    let predictabilitySql = (category === 'CLASSES') ? `SELECT 'Classes' as name, COALESCE(SUM(p.Amount), 0) as value FROM payment p JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED' ${statusCondition}` 
                          : (category === 'BOOKINGS') ? `SELECT 'Bookings' as name, COALESCE(SUM(p.Amount), 0) as value FROM payment p JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED' ${statusCondition}`
                          : `SELECT 'Classes' as name, COALESCE(SUM(p.Amount), 0) as value FROM payment p JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED' ${statusCondition} UNION ALL SELECT 'Bookings' as name, COALESCE(SUM(p.Amount), 0) as value FROM payment p JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED' ${statusCondition}`;
    const [predictabilityRows] = await pool.query(predictabilitySql, (category === 'ALL' || !category) ? [...params, ...params] : params);

    const [revenueByCourtRows] = await pool.query(`
        SELECT c.CourtName as name, COALESCE(SUM(p.Amount), 0) as value FROM court c
        LEFT JOIN booking b ON c.CourtID = b.CourtID LEFT JOIN bookingpayment bp ON b.BookingID = bp.BookingID
        LEFT JOIN payment p ON bp.PaymentID = p.PaymentID AND p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED' ${categoryCondition} ${statusCondition}
        GROUP BY c.CourtName ORDER BY value DESC, c.CourtName ASC`, params);

    const [kpiRows] = await pool.query(`SELECT COALESCE(SUM(CASE WHEN p.Status = 'VERIFIED' THEN p.Amount ELSE 0 END), 0) as totalRevenue, COUNT(CASE WHEN p.Status = 'VERIFIED' THEN 1 END) as verified, COUNT(CASE WHEN p.Status = 'PENDING' THEN 1 END) as pending, COUNT(CASE WHEN p.Status = 'REJECTED' THEN 1 END) as rejected FROM payment p WHERE p.PaidAt >= ? AND p.PaidAt <= ? ${categoryCondition} ${statusCondition}`, params);

    return { rows, revenueTrend: revenueRows, methods: methodRows, predictability: predictabilityRows, revenueByCourt: revenueByCourtRows, kpis: kpiRows[0] };
}

// generate student participation statistics and attendance rates
async function getAttendanceReport(start, end, classId) {
    const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];
    let classCondition = "";
    let params = [...dateFilter];
    if (classId && classId !== 'ALL' && classId !== 'undefined') {
        classCondition = " AND cs.ClassID = ? ";
        params.push(classId);
    }

    const [rows] = await pool.query(`
        SELECT a.AttendanceID as id, cl.Title as ClassName, a.MarkedAt as date, CONCAT(u.FirstName, ' ', u.LastName) as student, a.Status 
        FROM attendance a LEFT JOIN enrollment e ON a.EnrollmentID = e.EnrollmentID LEFT JOIN useraccount u ON e.UserID = u.UserID 
        LEFT JOIN classsession cs ON a.SessionID = cs.SessionID LEFT JOIN class cl ON cs.ClassID = cl.ClassID 
        WHERE a.MarkedAt BETWEEN ? AND ? ${classCondition} ORDER BY a.MarkedAt DESC`, params);

    const [classStats] = await pool.query(`
        SELECT cl.Title as name, s.ColorCode as color, ROUND((COUNT(CASE WHEN a.Status='PRESENT' THEN 1 END) / COUNT(*)) * 100, 1) as value
        FROM attendance a LEFT JOIN classsession cs ON a.SessionID = cs.SessionID LEFT JOIN class cl ON cs.ClassID = cl.ClassID LEFT JOIN sport s ON cl.SportID = s.SportID
        WHERE a.MarkedAt >= ? AND a.MarkedAt <= ? ${classCondition} GROUP BY cl.Title, s.ColorCode`, params);

    const [kpiRows] = await pool.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN a.Status = 'PRESENT' THEN 1 END) as present, COUNT(CASE WHEN a.Status = 'ABSENT' THEN 1 END) as absent, COUNT(DISTINCT CONCAT(a.SessionID, DATE(a.MarkedAt))) as uniqueSessions FROM attendance a LEFT JOIN classsession cs ON a.SessionID = cs.SessionID WHERE a.MarkedAt >= ? AND a.MarkedAt <= ? ${classCondition}`, params);

    return { rows, charts: { attendancePerClass: classStats }, kpis: kpiRows[0] };
}

// generate report on student registrations and class popularity
async function getEnrollmentsReport(start, end, classId) {
    const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];
    let classCondition = "";
    let params = [...dateFilter];
    if (classId && classId !== 'ALL' && classId !== 'undefined') {
        classCondition = " AND e.ClassID = ? ";
        params.push(classId);
    }

    const [rows] = await pool.query(`
        SELECT e.EnrollmentID as id, CONCAT(u.FirstName, ' ', u.LastName) as player, cl.Title as ClassName, e.EnrolledAt as dateEnrolled, e.Status 
        FROM enrollment e LEFT JOIN useraccount u ON e.UserID = u.UserID LEFT JOIN class cl ON e.ClassID = cl.ClassID 
        WHERE e.EnrolledAt >= ? AND e.EnrolledAt <= ? ${classCondition} ORDER BY e.EnrolledAt DESC`, params);

    const [popularRows] = await pool.query(`
        SELECT cl.Title as name, s.ColorCode as color, COUNT(e.EnrollmentID) as value
        FROM class cl JOIN sport s ON cl.SportID = s.SportID LEFT JOIN enrollment e ON cl.ClassID = e.ClassID AND e.EnrolledAt >= ? AND e.EnrolledAt <= ?
        WHERE cl.Status = 'ACTIVE' ${classId && classId !== 'ALL' ? " AND cl.ClassID = ? " : ""}
        GROUP BY cl.Title, s.ColorCode ORDER BY value DESC`, classId && classId !== 'ALL' ? [...dateFilter, classId] : params);

    const [dailyRows] = await pool.query(`SELECT DATE_FORMAT(e.EnrolledAt, '%Y-%m-%d') as date, COUNT(*) as count FROM enrollment e WHERE e.EnrolledAt >= ? AND e.EnrolledAt <= ? ${classCondition} GROUP BY date ORDER BY date ASC`, params);
    const [kpiRows] = await pool.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN e.Status = 'ENROLLED' THEN 1 END) as active, COUNT(CASE WHEN e.Status = 'CANCELLED' THEN 1 END) as cancelled FROM enrollment e WHERE e.EnrolledAt >= ? AND e.EnrolledAt <= ? ${classCondition}`, params);

    return { rows, popularClasses: popularRows, dailyEnrollments: dailyRows, kpis: kpiRows[0] };
}

module.exports = {
    getDashboardData,
    getBookingsReport,
    getPaymentsReport,
    getAttendanceReport,
    getEnrollmentsReport
};

