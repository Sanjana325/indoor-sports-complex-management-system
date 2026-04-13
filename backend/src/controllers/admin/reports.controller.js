const { pool } = require("../../config/db");

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

// Get bookings within a date range
exports.getBookingsReport = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        const [rows] = await pool.query(`
            SELECT 
                b.BookingID as id, 
                CONCAT(u.FirstName, ' ', u.LastName) as player, 
                c.CourtName as court, 
                b.StartDateTime as date, 
                b.EndDateTime as endDate,
                b.Status,
                s.SportName
            FROM booking b 
            JOIN court c ON b.CourtID = c.CourtID 
            JOIN useraccount u ON b.UserID = u.UserID 
            JOIN sport s ON b.SportID = s.SportID
            WHERE b.StartDateTime >= ? AND b.StartDateTime <= ?
            ORDER BY b.StartDateTime DESC
        `, [`${start} 00:00:00`, `${end} 23:59:59`]);

        // Format for frontend
        const formatted = rows.map(r => ({
            id: `B-${String(r.id).padStart(6, '0')}`,
            player: r.player,
            court: r.court,
            date: r.date.toISOString().split('T')[0],
            time: `${r.date.getHours().toString().padStart(2, '0')}:${r.date.getMinutes().toString().padStart(2, '0')} - ${r.endDate.getHours().toString().padStart(2, '0')}:${r.endDate.getMinutes().toString().padStart(2, '0')}`,
            status: r.Status,
            sport: r.SportName
        }));

        res.json({ reports: formatted });
    } catch (err) {
        next(err);
    }
};

// Get payments within a date range
exports.getPaymentsReport = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        const [rows] = await pool.query(`
            SELECT 
                p.PaymentID as id, 
                CONCAT(u.FirstName, ' ', u.LastName) as name, 
                p.Amount as amount, 
                p.PaidAt as date, 
                p.Status, 
                p.Method 
            FROM payment p 
            JOIN useraccount u ON p.UserID = u.UserID 
            WHERE p.PaidAt >= ? AND p.PaidAt <= ? 
            ORDER BY p.PaidAt DESC
        `, [`${start} 00:00:00`, `${end} 23:59:59`]);

        const formatted = rows.map(r => ({
            id: `PAY${String(r.id).padStart(3, '0')}`,
            name: r.name,
            category: "Transaction", // Default category
            method: r.Method === 'BANK_SLIP' ? "Bank Slip" : "Online",
            amount: parseFloat(r.amount),
            date: r.date.toISOString().split('T')[0],
            status: r.Status
        }));

        res.json({ reports: formatted });
    } catch (err) {
        next(err);
    }
};

// Get attendance within a date range
exports.getAttendanceReport = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        const [rows] = await pool.query(`
            SELECT 
                a.AttendanceID as id, 
                cl.ClassName, 
                a.MarkedAt as date, 
                CONCAT(u.FirstName, ' ', u.LastName) as student, 
                a.Status 
            FROM attendance a 
            JOIN enrollment e ON a.EnrollmentID = e.EnrollmentID 
            JOIN useraccount u ON e.UserID = u.UserID 
            JOIN classsession cs ON a.SessionID = cs.SessionID 
            JOIN class cl ON cs.ClassID = cl.ClassID 
            WHERE a.MarkedAt >= ? AND a.MarkedAt <= ? 
            ORDER BY a.MarkedAt DESC
        `, [`${start} 00:00:00`, `${end} 23:59:59`]);

        const formatted = rows.map(r => ({
            id: `AT-${String(r.id).padStart(4, '0')}`,
            className: r.ClassName,
            date: r.date.toISOString().split('T')[0],
            student: r.student,
            status: r.Status
        }));

        res.json({ reports: formatted });
    } catch (err) {
        next(err);
    }
};

// Get enrollments within a date range
exports.getEnrollmentsReport = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        const [rows] = await pool.query(`
            SELECT 
                e.EnrollmentID as id, 
                CONCAT(u.FirstName, ' ', u.LastName) as player, 
                cl.ClassName, 
                e.EnrolledAt as dateEnrolled, 
                e.Status 
            FROM enrollment e 
            JOIN useraccount u ON e.UserID = u.UserID 
            JOIN class cl ON e.ClassID = cl.ClassID 
            WHERE e.EnrolledAt >= ? AND e.EnrolledAt <= ? 
            ORDER BY e.EnrolledAt DESC
        `, [`${start} 00:00:00`, `${end} 23:59:59`]);

        const formatted = rows.map(r => ({
            id: `ENR-${String(r.id).padStart(4, '0')}`,
            player: r.player,
            className: r.ClassName,
            dateEnrolled: r.dateEnrolled.toISOString().split('T')[0],
            status: r.Status
        }));

        res.json({ reports: formatted });
    } catch (err) {
        next(err);
    }
};
