const { pool } = require("../../config/db");

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
        const [rows] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM useraccount WHERE Role != 'SUPER_ADMIN') as users,
                (SELECT COUNT(*) FROM booking) as bookings,
                (SELECT COUNT(*) FROM payment WHERE Status = 'VERIFIED') as payments,
                (SELECT COUNT(*) FROM class WHERE Status = 'ACTIVE') as classes
        `);
        res.json({ totals: rows[0] });
    } catch (err) {
        next(err);
    }
};

// Get bookings within a date range with detailed analytics
exports.getBookingsReport = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];

        // 1. Fetch raw rows
        const [rows] = await pool.query(`
            SELECT b.BookingID as id, CONCAT(u.FirstName, ' ', u.LastName) as player, 
                   c.CourtName as court, b.StartDateTime as date, b.EndDateTime as endDate,
                   b.Status, s.SportName
            FROM booking b 
            JOIN court c ON b.CourtID = c.CourtID 
            JOIN useraccount u ON b.UserID = u.UserID 
            JOIN sport s ON b.SportID = s.SportID
            WHERE b.StartDateTime >= ? AND b.StartDateTime <= ?
            ORDER BY b.StartDateTime DESC
        `, dateFilter);

        // 2. Fetch Peak Booking Hour
        const [peakRows] = await pool.query(`
            SELECT HOUR(StartDateTime) as hour, COUNT(*) as count 
            FROM booking 
            WHERE StartDateTime >= ? AND StartDateTime <= ?
            GROUP BY hour ORDER BY count DESC LIMIT 1
        `, dateFilter);

        // 3. Fetch Bookings Per Day (Chart)
        const [dailyRows] = await pool.query(`
            SELECT DATE_FORMAT(StartDateTime, '%Y-%m-%d') as date, COUNT(*) as count 
            FROM booking 
            WHERE StartDateTime >= ? AND StartDateTime <= ?
            GROUP BY date ORDER BY date ASC
        `, dateFilter);

        // 4. Fetch Bookings By Sport (Chart)
        const [sportRows] = await pool.query(`
            SELECT s.SportName as name, COUNT(*) as value
            FROM booking b
            JOIN sport s ON b.SportID = s.SportID
            WHERE b.StartDateTime >= ? AND b.StartDateTime <= ?
            GROUP BY s.SportName
        `, dateFilter);

        const formatted = rows.map(r => ({
            id: `B-${String(r.id).padStart(6, '0')}`,
            player: r.player,
            court: r.court,
            date: r.date.toISOString().split('T')[0],
            time: `${r.date.getHours().toString().padStart(2, '0')}:${r.date.getMinutes().toString().padStart(2, '0')} - ${r.endDate.getHours().toString().padStart(2, '0')}:${r.endDate.getMinutes().toString().padStart(2, '0')}`,
            status: r.Status,
            sport: r.SportName
        }));

        res.json({ 
            reports: formatted,
            kpis: {
                totalBookings: rows.length,
                confirmedBookings: rows.filter(r => r.Status === 'CONFIRMED').length,
                cancelledBookings: rows.filter(r => r.Status === 'CANCELLED').length,
                peakBookingHour: peakRows.length > 0 ? formatHour(peakRows[0].hour) : "N/A"
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
        const { start, end } = req.query;
        const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];

        const [rows] = await pool.query(`
            SELECT p.PaymentID as id, CONCAT(u.FirstName, ' ', u.LastName) as name, 
                   p.Amount as amount, p.PaidAt as date, p.Status, p.Method 
            FROM payment p 
            JOIN useraccount u ON p.UserID = u.UserID 
            WHERE p.PaidAt >= ? AND p.PaidAt <= ? 
            ORDER BY p.PaidAt DESC
        `, dateFilter);

        const [revenueRows] = await pool.query(`
            SELECT DATE_FORMAT(PaidAt, '%Y-%m-%d') as date, SUM(Amount) as total 
            FROM payment 
            WHERE PaidAt >= ? AND PaidAt <= ? AND Status = 'VERIFIED'
            GROUP BY date ORDER BY date ASC
        `, dateFilter);

        const [methodRows] = await pool.query(`
            SELECT Method as name, COUNT(*) as value
            FROM payment 
            WHERE PaidAt >= ? AND PaidAt <= ?
            GROUP BY Method
        `, dateFilter);

        const formatted = rows.map(r => ({
            id: `PAY${String(r.id).padStart(3, '0')}`,
            name: r.name,
            category: "Transaction",
            method: r.Method === 'BANK_SLIP' ? "Bank Slip" : "Online",
            amount: parseFloat(r.amount),
            date: r.date.toISOString().split('T')[0],
            status: r.Status
        }));

        const totalRevenue = rows.filter(r => r.Status === 'VERIFIED').reduce((sum, r) => sum + parseFloat(r.amount), 0);

        res.json({ 
            reports: formatted,
            kpis: {
                totalRevenue: totalRevenue,
                verifiedPayments: rows.filter(r => r.Status === 'VERIFIED').length,
                pendingPayments: rows.filter(r => r.Status === 'PENDING').length,
                rejectedPayments: rows.filter(r => r.Status === 'REJECTED').length
            },
            charts: {
                revenueOverTime: revenueRows,
                paymentMethodSplit: methodRows.map(m => ({ ...m, name: m.name === 'BANK_SLIP' ? 'Bank Slip' : 'Online' }))
            }
        });
    } catch (err) {
        next(err);
    }
};

// Get attendance within a date range with participation analytics
exports.getAttendanceReport = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];

        const [rows] = await pool.query(`
            SELECT a.AttendanceID as id, cl.ClassName, a.MarkedAt as date, 
                   CONCAT(u.FirstName, ' ', u.LastName) as student, a.Status 
            FROM attendance a 
            LEFT JOIN enrollment e ON a.EnrollmentID = e.EnrollmentID 
            LEFT JOIN useraccount u ON e.UserID = u.UserID 
            LEFT JOIN classsession cs ON a.SessionID = cs.SessionID 
            LEFT JOIN class cl ON cs.ClassID = cl.ClassID 
            WHERE a.MarkedAt BETWEEN ? AND ? 
            ORDER BY a.MarkedAt DESC
        `, dateFilter);

        const [classStats] = await pool.query(`
            SELECT cl.ClassName as name,
                   ROUND((COUNT(CASE WHEN a.Status='PRESENT' THEN 1 END) / COUNT(*)) * 100, 1) as value
            FROM attendance a
            LEFT JOIN classsession cs ON a.SessionID = cs.SessionID
            LEFT JOIN class cl ON cs.ClassID = cl.ClassID
            WHERE a.MarkedAt >= ? AND a.MarkedAt <= ?
            GROUP BY cl.ClassName
        `, [`${start} 00:00:00`, `${end} 23:59:59`]);

        const formatted = rows.map(r => ({
            id: `AT-${String(r.id || r.AttendanceID).padStart(4, '0')}`,
            className: r.ClassName || 'N/A',
            date: r.date || r.MarkedAt ? new Date(r.date || r.MarkedAt).toISOString().split('T')[0] : 'N/A',
            student: r.student || 'Unknown Student',
            status: r.Status
        }));

        const totalPresent = rows.filter(r => r.Status === 'PRESENT').length;
        const totalAbsent = rows.filter(r => r.Status === 'ABSENT').length;
        const avgRate = rows.length > 0 ? ((totalPresent / rows.length) * 100).toFixed(1) : 0;

        res.json({ 
            reports: formatted,
            kpis: {
                totalSessions: new Set(rows.map(r => (r.ClassName || 'N/A') + (r.date || 'N/A'))).size,
                averageAttendanceRate: `${avgRate}%`,
                totalPresent,
                totalAbsent
            },
            charts: {
                attendancePerClass: classStats
            }
        });
    } catch (err) {
        next(err);
    }
};

// Get enrollments within a date range with class popularity analytics
exports.getEnrollmentsReport = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        const dateFilter = [`${start} 00:00:00`, `${end} 23:59:59`];

        const [rows] = await pool.query(`
            SELECT e.EnrollmentID as id, CONCAT(u.FirstName, ' ', u.LastName) as player, 
                   cl.ClassName, e.EnrolledAt as dateEnrolled, e.Status 
            FROM enrollment e 
            LEFT JOIN useraccount u ON e.UserID = u.UserID 
            LEFT JOIN class cl ON e.ClassID = cl.ClassID 
            WHERE e.EnrolledAt >= ? AND e.EnrolledAt <= ? 
            ORDER BY e.EnrolledAt DESC
        `, dateFilter);

        const [popularRows] = await pool.query(`
            SELECT cl.ClassName as name, COUNT(*) as value
            FROM enrollment e
            JOIN class cl ON e.ClassID = cl.ClassID
            WHERE e.EnrolledAt >= ? AND e.EnrolledAt <= ?
            GROUP BY cl.ClassName ORDER BY value DESC
        `, dateFilter);

        const [dailyRows] = await pool.query(`
            SELECT DATE_FORMAT(EnrolledAt, '%Y-%m-%d') as date, COUNT(*) as count 
            FROM enrollment 
            WHERE EnrolledAt >= ? AND EnrolledAt <= ?
            GROUP BY date ORDER BY date ASC
        `, dateFilter);

        const formatted = rows.map(r => ({
            id: `ENR-${String(r.id).padStart(4, '0')}`,
            player: r.player || 'Unknown Player',
            className: r.ClassName || 'N/A',
            dateEnrolled: r.dateEnrolled ? r.dateEnrolled.toISOString().split('T')[0] : 'N/A',
            status: r.Status
        }));

        res.json({ 
            reports: formatted,
            kpis: {
                totalEnrollments: rows.length,
                activeEnrollments: rows.filter(r => r.Status === 'ENROLLED').length,
                cancelledEnrollments: rows.filter(r => r.Status === 'CANCELLED').length,
                mostPopularClass: popularRows.length > 0 ? popularRows[0].name : "N/A"
            },
            charts: {
                enrollmentsPerClass: popularRows,
                dailyEnrollments: dailyRows
            }
        });
    } catch (err) {
        next(err);
    }
};
