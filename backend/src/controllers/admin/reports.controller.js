const { pool } = require("../../config/db");

// Configurable facility operating hours for utilization math 
// (e.g. 6 AM - 10 PM = 16 hours). Can be dynamically fetched from DB later.
const OPERATING_HOURS_PER_DAY = 16;

// Helper to format hour to 12h format
const formatHour = (h) => {
    if (h === undefined || h === null) return "N/A";
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
};

// Get overview stats for the admin dashboard
exports.getDashboardStats = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        let query, params;

        if (start && end) {
            const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];
            
            // Basic Totals (Accrual Basis - based on Service Date)
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
                    (SELECT COUNT(*) FROM payment WHERE Status = 'PENDING' AND PaidAt >= ? AND PaidAt <= ?) as pendingActions,
                    (SELECT COUNT(*) FROM class WHERE Status = 'ACTIVE') as classes
            `, [dateFilter[0], dateFilter[1], ...dateFilter, ...dateFilter, ...dateFilter]);

            // Revenue Trend (Scheduled Revenue)
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

            // Revenue by Sport (Accrual Basis)
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

            // Revenue by Court (Unified - Bookings & Classes)
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

            const totals = totalsRows[0];
            totals.revenue = parseFloat(totals.revenue || 0);

            res.json({ 
                totals,
                charts: {
                    revenueTrend: trendRows,
                    revenueBySport: sportRows,
                    revenueByCourt: courtRows
                }
            });
        } else {
            // Fallback for global stats if needed
            const [rows] = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM useraccount WHERE Role != 'SUPER_ADMIN') as users,
                    (SELECT COUNT(*) FROM booking WHERE Status IN ('CONFIRMED', 'CANCELLED')) as bookings,
                    (SELECT SUM(Amount) FROM payment WHERE Status = 'VERIFIED') as revenue,
                    (SELECT COUNT(*) FROM payment WHERE Status = 'PENDING') as pendingActions,
                    (SELECT COUNT(*) FROM class WHERE Status = 'ACTIVE') as classes
            `);
            const totals = rows[0];
            totals.revenue = parseFloat(totals.revenue || 0);
            res.json({ totals, charts: { revenueTrend: [], revenueBySport: [], revenueByCourt: [] } });
        }
    } catch (err) {
        next(err);
    }
};

// Get bookings within a date range with detailed analytics
exports.getBookingsReport = async (req, res, next) => {
    try {
        const { start, end, method } = req.query;
        const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];

        let methodCondition = "";
        let methodParams = [...dateFilter];
        
        if (method && method !== 'ALL' && method !== 'undefined') {
            methodCondition = ` AND b.BookingID IN (
                SELECT bp.BookingID FROM bookingpayment bp
                JOIN payment pk ON bp.PaymentID = pk.PaymentID WHERE pk.Method = ?
            )`;
            methodParams.push(method);
        }

        // 1. Fetch raw rows
        const [rows] = await pool.query(`
            SELECT b.BookingID as id, CONCAT(u.FirstName, ' ', u.LastName) as player, u.PhoneNumber as playerPhone,
                   c.CourtName as court, b.StartDateTime as date, b.EndDateTime as endDate, b.CreatedAt as created,
                   b.Status, s.SportName, p.PaymentID as paymentId, p.Method as paymentMethod
            FROM booking b 
            JOIN court c ON b.CourtID = c.CourtID 
            JOIN useraccount u ON b.UserID = u.UserID 
            JOIN sport s ON b.SportID = s.SportID
            LEFT JOIN bookingpayment bp ON b.BookingID = bp.BookingID
            LEFT JOIN payment p ON bp.PaymentID = p.PaymentID
            WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition}
            ORDER BY b.StartDateTime DESC
        `, methodParams);

        // 2. Fetch Peak Booking Hour
        const [peakRows] = await pool.query(`
            SELECT HOUR(b.StartDateTime) as hour, COUNT(*) as count 
            FROM booking b
            WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition}
            GROUP BY hour ORDER BY count DESC LIMIT 1
        `, methodParams);

        // 3. Fetch Bookings Per Day (Chart)
        const [dailyRows] = await pool.query(`
            SELECT DATE_FORMAT(b.StartDateTime, '%Y-%m-%d') as date, COUNT(*) as count 
            FROM booking b
            WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition}
            GROUP BY date ORDER BY date ASC
        `, methodParams);

        // 4. Fetch Bookings By Sport (Chart)
        const [sportRows] = await pool.query(`
            SELECT s.SportName as name, s.ColorCode as color, COUNT(*) as value
            FROM booking b
            JOIN sport s ON b.SportID = s.SportID
            WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition}
            GROUP BY s.SportName, s.ColorCode
        `, methodParams);

        // 5. Fetch KPIs (Aggregation)
        const [kpiRows] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN b.Status = 'CONFIRMED' THEN 1 END) as confirmed,
                COUNT(CASE WHEN b.Status = 'CANCELLED' THEN 1 END) as cancelled
            FROM booking b
            WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? ${methodCondition}
        `, methodParams);
        const kpis = kpiRows[0];

        // 6. Calculate Court Utilization
        const diffDays = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
        const [courtCountRow] = await pool.query('SELECT COUNT(*) as count FROM court');
        const numCourts = courtCountRow[0].count;
        const totalAvailableHours = diffDays * numCourts * OPERATING_HOURS_PER_DAY;

        const [hoursBookedRow] = await pool.query(`
            SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, b.StartDateTime, b.EndDateTime)) / 60, 0) as totalHours
            FROM booking b
            WHERE b.StartDateTime >= ? AND b.StartDateTime <= ? AND b.Status = 'CONFIRMED' ${methodCondition}
        `, methodParams);

        const totalHoursBooked = hoursBookedRow[0].totalHours;
        const utilization = totalAvailableHours > 0 ? ((totalHoursBooked / totalAvailableHours) * 100).toFixed(1) : 0;

        const formatted = rows.map(r => ({
            id: `BKG-${String(r.id).padStart(6, '0')}`,
            player: r.player,
            playerPhone: r.playerPhone || 'N/A',
            court: r.court,
            sport: r.SportName,
            date: r.date.toISOString().split('T')[0],
            time: `${r.date.getHours().toString().padStart(2, '0')}:${r.date.getMinutes().toString().padStart(2, '0')} - ${r.endDate.getHours().toString().padStart(2, '0')}:${r.endDate.getMinutes().toString().padStart(2, '0')}`,
            created: r.created ? r.created.toISOString().split('T')[0] : 'N/A',
            paymentId: r.paymentId ? `PAY-${String(r.paymentId).padStart(6, '0')}` : 'N/A',
            method: r.paymentMethod ? (r.paymentMethod === 'BANK_SLIP' ? 'Bank Slip' : 'Online') : 'N/A',
            status: r.Status
        }));

            res.json({ 
            reports: formatted,
            kpis: {
                totalBookings: kpis.total,
                confirmedBookings: kpis.confirmed,
                cancelledBookings: kpis.cancelled,
                peakBookingHour: peakRows.length > 0 ? formatHour(peakRows[0].hour) : "N/A",
                courtUtilizationRate: `${utilization}%`
            },
            charts: {
                bookingsPerDay: dailyRows,
                bookingsBySport: sportRows
            }
        });
    } catch (err) {
        next(err);
    }
};

// Get payments within a date range with financial analytics
exports.getPaymentsReport = async (req, res, next) => {
    try {
        const { start, end, category } = req.query;
        const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];

        let categoryCondition = "";
        let categoryParams = [...dateFilter];
        if (category === 'CLASSES') {
            categoryCondition = " AND p.PaymentID IN (SELECT PaymentID FROM enrollmentmonthpayment) ";
        } else if (category === 'BOOKINGS') {
            categoryCondition = " AND p.PaymentID IN (SELECT PaymentID FROM bookingpayment) ";
        }

        const [rows] = await pool.query(`
            SELECT p.PaymentID as id, CONCAT(u.FirstName, ' ', u.LastName) as name, u.PhoneNumber as phone,
                   p.Amount as amount, p.PaidAt as date, p.VerifiedAt as verified, p.Status, p.Method,
                   EXISTS(SELECT 1 FROM bookingpayment bp WHERE bp.PaymentID = p.PaymentID) as isBooking
            FROM payment p 
            JOIN useraccount u ON p.UserID = u.UserID 
            WHERE p.PaidAt >= ? AND p.PaidAt <= ? ${categoryCondition}
            ORDER BY p.PaidAt DESC
        `, categoryParams);

        const [revenueRows] = await pool.query(`
            SELECT DATE_FORMAT(p.PaidAt, '%Y-%m-%d') as date, SUM(p.Amount) as total 
            FROM payment p
            WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED' ${categoryCondition}
            GROUP BY date ORDER BY date ASC
        `, categoryParams);

        const [methodRows] = await pool.query(`
            SELECT p.Method as name, COUNT(*) as value
            FROM payment p
            WHERE p.PaidAt >= ? AND p.PaidAt <= ? ${categoryCondition}
            GROUP BY p.Method
        `, categoryParams);

        // Fetch Revenue Predictability
        let predictabilitySql = "";
        let predictParams = [...dateFilter];
        if (category === 'CLASSES') {
            predictabilitySql = `
                SELECT 'Classes' as name, COALESCE(SUM(p.Amount), 0) as value
                FROM payment p
                JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID
                WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED'
            `;
        } else if (category === 'BOOKINGS') {
            predictabilitySql = `
                SELECT 'Bookings' as name, COALESCE(SUM(p.Amount), 0) as value
                FROM payment p
                JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID
                WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED'
            `;
        } else {
            predictabilitySql = `
                SELECT 'Classes' as name, COALESCE(SUM(p.Amount), 0) as value
                FROM payment p
                JOIN enrollmentmonthpayment emp ON p.PaymentID = emp.PaymentID
                WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED'
                UNION ALL
                SELECT 'Bookings' as name, COALESCE(SUM(p.Amount), 0) as value
                FROM payment p
                JOIN bookingpayment bp ON p.PaymentID = bp.PaymentID
                WHERE p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED'
            `;
            predictParams = [...dateFilter, ...dateFilter];
        }
        
        const [predictabilityRows] = await pool.query(predictabilitySql, predictParams);

        // Fetch Revenue by Court
        const [revenueByCourtRows] = await pool.query(`
            SELECT c.CourtName as name, COALESCE(SUM(p.Amount), 0) as value
            FROM court c
            LEFT JOIN booking b ON c.CourtID = b.CourtID
            LEFT JOIN bookingpayment bp ON b.BookingID = bp.BookingID
            LEFT JOIN payment p ON bp.PaymentID = p.PaymentID 
                AND p.PaidAt >= ? AND p.PaidAt <= ? AND p.Status = 'VERIFIED' ${categoryCondition}
            GROUP BY c.CourtName
            ORDER BY value DESC, c.CourtName ASC
        `, categoryParams);

        const formatted = rows.map(r => ({
            id: `PAY-${String(r.id).padStart(6, '0')}`,
            name: r.name,
            phone: r.phone || 'N/A',
            category: r.isBooking ? "Court Booking" : "Class Enrollment",
            method: r.Method === 'BANK_SLIP' ? "Bank Slip" : "Online",
            amount: parseFloat(r.amount),
            date: r.date.toISOString().split('T')[0],
            time: `${r.date.getHours().toString().padStart(2, '0')}:${r.date.getMinutes().toString().padStart(2, '0')}`,
            verified: r.verified ? r.verified.toISOString().split('T')[0] : 'N/A',
            status: r.Status
        }));

        const [kpiRows] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN p.Status = 'VERIFIED' THEN p.Amount ELSE 0 END), 0) as totalRevenue,
                COUNT(CASE WHEN p.Status = 'VERIFIED' THEN 1 END) as verified,
                COUNT(CASE WHEN p.Status = 'PENDING' THEN 1 END) as pending,
                COUNT(CASE WHEN p.Status = 'REJECTED' THEN 1 END) as rejected
            FROM payment p
            WHERE p.PaidAt >= ? AND p.PaidAt <= ? ${categoryCondition}
        `, categoryParams);
        const kpis = kpiRows[0];

        res.json({ 
            reports: formatted,
            kpis: {
                totalRevenue: parseFloat(kpis.totalRevenue),
                verifiedPayments: kpis.verified,
                pendingPayments: kpis.pending,
                rejectedPayments: kpis.rejected
            },
            charts: {
                revenueOverTime: revenueRows.map(r => ({ ...r, total: parseFloat(r.total) })),
                paymentMethodSplit: methodRows.map(m => ({ ...m, name: m.name === 'BANK_SLIP' ? 'Bank Slip' : 'Online', value: parseFloat(m.value) })),
                revenuePredictability: predictabilityRows.map(p => ({ ...p, value: parseFloat(p.value) })),
                revenueByCourt: revenueByCourtRows.map(c => ({ ...c, value: parseFloat(c.value) }))
            }
        });
    } catch (err) {
        next(err);
    }
};

// Get attendance within a date range with participation analytics
exports.getAttendanceReport = async (req, res, next) => {
    try {
        const { start, end, classId } = req.query;
        const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];

        const [classesList] = await pool.query('SELECT ClassID as id, Title as title FROM class WHERE Status = "ACTIVE" ORDER BY Title ASC');

        let classCondition = "";
        let classParams = [...dateFilter];
        
        if (classId && classId !== 'ALL' && classId !== 'undefined') {
            classCondition = " AND cs.ClassID = ? ";
            classParams.push(classId);
        }

        const [rows] = await pool.query(`
            SELECT a.AttendanceID as id, cl.Title as ClassName, a.MarkedAt as date, 
                   CONCAT(u.FirstName, ' ', u.LastName) as student, a.Status 
            FROM attendance a 
            LEFT JOIN enrollment e ON a.EnrollmentID = e.EnrollmentID 
            LEFT JOIN useraccount u ON e.UserID = u.UserID 
            LEFT JOIN classsession cs ON a.SessionID = cs.SessionID 
            LEFT JOIN class cl ON cs.ClassID = cl.ClassID 
            WHERE a.MarkedAt BETWEEN ? AND ? ${classCondition}
            ORDER BY a.MarkedAt DESC
        `, classParams);

        const [classStats] = await pool.query(`
            SELECT cl.Title as name, s.ColorCode as color,
                   ROUND((COUNT(CASE WHEN a.Status='PRESENT' THEN 1 END) / COUNT(*)) * 100, 1) as value
            FROM attendance a
            LEFT JOIN classsession cs ON a.SessionID = cs.SessionID
            LEFT JOIN class cl ON cs.ClassID = cl.ClassID
            LEFT JOIN sport s ON cl.SportID = s.SportID
            WHERE a.MarkedAt >= ? AND a.MarkedAt <= ? ${classCondition}
            GROUP BY cl.Title, s.ColorCode
        `, classParams);

        const formatted = rows.map(r => ({
            id: `ATT-${String(r.id || r.AttendanceID).padStart(6, '0')}`,
            className: r.ClassName || 'N/A',
            date: r.date || r.MarkedAt ? new Date(r.date || r.MarkedAt).toISOString().split('T')[0] : 'N/A',
            student: r.student || 'Unknown Student',
            status: r.Status
        }));

        // Aggregated KPIs for Attendance
        const [kpiRows] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN a.Status = 'PRESENT' THEN 1 END) as present,
                COUNT(CASE WHEN a.Status = 'ABSENT' THEN 1 END) as absent,
                COUNT(DISTINCT CONCAT(a.SessionID, DATE(a.MarkedAt))) as uniqueSessions
            FROM attendance a
            LEFT JOIN classsession cs ON a.SessionID = cs.SessionID
            WHERE a.MarkedAt >= ? AND a.MarkedAt <= ? ${classCondition}
        `, classParams);
        
        const kpis = kpiRows[0];
        const avgRate = kpis.total > 0 ? ((kpis.present / kpis.total) * 100).toFixed(1) : 0;

        res.json({ 
            reports: formatted,
            kpis: {
                totalSessions: kpis.uniqueSessions,
                averageAttendanceRate: `${avgRate}%`,
                totalPresent: kpis.present,
                totalAbsent: kpis.absent
            },
            charts: {
                attendancePerClass: classStats
            },
            metadata: {
                classes: classesList
            }
        });
    } catch (err) {
        next(err);
    }
};

// Get enrollments within a date range with class popularity analytics
exports.getEnrollmentsReport = async (req, res, next) => {
    try {
        const { start, end, classId } = req.query;
        const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];

        const [classesList] = await pool.query('SELECT ClassID as id, Title as title FROM class WHERE Status = "ACTIVE" ORDER BY Title ASC');

        let classCondition = "";
        let classParams = [...dateFilter];
        let popClassCondition = "";
        
        if (classId && classId !== 'ALL' && classId !== 'undefined') {
            classCondition = " AND e.ClassID = ? ";
            popClassCondition = " AND cl.ClassID = ? ";
            classParams.push(classId);
        }

        const [rows] = await pool.query(`
            SELECT e.EnrollmentID as id, CONCAT(u.FirstName, ' ', u.LastName) as player, 
                   cl.Title as ClassName, e.EnrolledAt as dateEnrolled, e.Status 
            FROM enrollment e 
            LEFT JOIN useraccount u ON e.UserID = u.UserID 
            LEFT JOIN class cl ON e.ClassID = cl.ClassID 
            WHERE e.EnrolledAt >= ? AND e.EnrolledAt <= ? ${classCondition}
            ORDER BY e.EnrolledAt DESC
        `, classParams);

        const [popularRows] = await pool.query(`
            SELECT cl.Title as name, s.ColorCode as color, COUNT(e.EnrollmentID) as value
            FROM class cl
            JOIN sport s ON cl.SportID = s.SportID
            LEFT JOIN enrollment e ON cl.ClassID = e.ClassID AND e.EnrolledAt >= ? AND e.EnrolledAt <= ?
            WHERE cl.Status = 'ACTIVE' ${popClassCondition}
            GROUP BY cl.Title, s.ColorCode ORDER BY value DESC
        `, classParams);

        const [dailyRows] = await pool.query(`
            SELECT DATE_FORMAT(e.EnrolledAt, '%Y-%m-%d') as date, COUNT(*) as count 
            FROM enrollment e
            WHERE e.EnrolledAt >= ? AND e.EnrolledAt <= ? ${classCondition}
            GROUP BY date ORDER BY date ASC
        `, classParams);

        const formatted = rows.map(r => ({
            id: `ENR-${String(r.id).padStart(6, '0')}`,
            player: r.player || 'Unknown Player',
            className: r.ClassName || 'N/A',
            dateEnrolled: r.dateEnrolled ? r.dateEnrolled.toISOString().split('T')[0] : 'N/A',
            status: r.Status
        }));

        const [kpiRows] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN e.Status = 'ENROLLED' THEN 1 END) as active,
                COUNT(CASE WHEN e.Status = 'CANCELLED' THEN 1 END) as cancelled
            FROM enrollment e
            WHERE e.EnrolledAt >= ? AND e.EnrolledAt <= ? ${classCondition}
        `, classParams);
        const kpis = kpiRows[0];

        res.json({ 
            reports: formatted,
            kpis: {
                totalEnrollments: kpis.total,
                activeEnrollments: kpis.active,
                cancelledEnrollments: kpis.cancelled,
                mostPopularClass: popularRows.length > 0 ? popularRows[0].name : "N/A"
            },
            charts: {
                enrollmentsPerClass: popularRows,
                dailyEnrollments: dailyRows
            },
            metadata: {
                classes: classesList
            }
        });
    } catch (err) {
        next(err);
    }
};
