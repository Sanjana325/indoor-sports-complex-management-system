const reportModel = require("../../models/report.model");
const { pool } = require("../../config/db");

// helper to convert 24h format to a readable 12h AM/PM string
const formatHour = (h) => {
    if (h === undefined || h === null) return "N/A";
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12} ${ampm}`;
};

// get summary counts and revenue data for the main admin dashboard
exports.getDashboardStats = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        if (start && end) {
            const data = await reportModel.getDashboardData(start, end);
            data.totals.revenue = parseFloat(data.totals.revenue || 0);
            res.json(data);
        } else {
            // default quick stats for the top bar
            const [rows] = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM useraccount WHERE Role != 'SUPER_ADMIN') as users,
                    (SELECT COUNT(*) FROM booking WHERE Status IN ('CONFIRMED', 'CANCELLED')) as bookings,
                    (SELECT SUM(Amount) FROM payment WHERE Status = 'VERIFIED') as revenue,
                    ((SELECT COUNT(*) FROM payment WHERE Status = 'PENDING') + (SELECT COUNT(*) FROM classsession WHERE Status = 'CANCELLED' AND IsAcknowledged = 0)) as pendingActions,
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

// get detailed list and analytics for court bookings
exports.getBookingsReport = async (req, res, next) => {
    try {
        const { start, end, method } = req.query;
        const data = await reportModel.getBookingsReport(start, end, method);

        // format database rows into human-readable report objects
        const formatted = data.rows.map(r => ({
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
                totalBookings: data.kpis.total,
                confirmedBookings: data.kpis.confirmed,
                cancelledBookings: data.kpis.cancelled,
                peakBookingHour: formatHour(data.kpis.peakHour),
                courtUtilizationRate: `${data.kpis.utilization}%`
            },
            charts: data.charts
        });
    } catch (err) {
        next(err);
    }
};

// get financial breakdown and revenue trends
exports.getPaymentsReport = async (req, res, next) => {
    try {
        const { start, end, category, status } = req.query;
        const data = await reportModel.getPaymentsReport(start, end, category, status);

        const formatted = data.rows.map(r => ({
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

        res.json({ 
            reports: formatted,
            kpis: {
                totalRevenue: parseFloat(data.kpis.totalRevenue),
                verifiedPayments: data.kpis.verified,
                pendingPayments: data.kpis.pending,
                rejectedPayments: data.kpis.rejected
            },
            charts: {
                revenueOverTime: data.revenueTrend.map(r => ({ ...r, total: parseFloat(r.total) })),
                paymentMethodSplit: data.methods.map(m => ({ ...m, name: m.name === 'BANK_SLIP' ? 'Bank Slip' : 'Online', value: parseFloat(m.value) })),
                revenuePredictability: data.predictability.map(p => ({ ...p, value: parseFloat(p.value) })),
                revenueByCourt: data.revenueByCourt.map(c => ({ ...c, value: parseFloat(c.value) }))
            }
        });
    } catch (err) {
        next(err);
    }
};

// get student participation data and attendance rates
exports.getAttendanceReport = async (req, res, next) => {
    try {
        const { start, end, classId } = req.query;
        const data = await reportModel.getAttendanceReport(start, end, classId);
        
        const [classesList] = await pool.query('SELECT ClassID as id, Title as title FROM class WHERE Status = "ACTIVE" ORDER BY Title ASC');

        const formatted = data.rows.map(r => ({
            id: `ATT-${String(r.id).padStart(6, '0')}`,
            className: r.ClassName || 'N/A',
            date: r.date ? new Date(r.date).toISOString().split('T')[0] : 'N/A',
            student: r.student || 'Unknown Student',
            status: r.Status
        }));

        res.json({ 
            reports: formatted,
            kpis: {
                totalSessions: data.kpis.uniqueSessions,
                averageAttendanceRate: `${data.kpis.total > 0 ? ((data.kpis.present / data.kpis.total) * 100).toFixed(1) : 0}%`,
                totalPresent: data.kpis.present,
                totalAbsent: data.kpis.absent
            },
            charts: data.charts,
            metadata: { classes: classesList }
        });
    } catch (err) {
        next(err);
    }
};

// get statistics on student registrations and class popularity
exports.getEnrollmentsReport = async (req, res, next) => {
    try {
        const { start, end, classId } = req.query;
        const data = await reportModel.getEnrollmentsReport(start, end, classId);

        const [classesList] = await pool.query('SELECT ClassID as id, Title as title FROM class WHERE Status = "ACTIVE" ORDER BY Title ASC');

        const formatted = data.rows.map(r => ({
            id: `ENR-${String(r.id).padStart(6, '0')}`,
            player: r.player || 'Unknown Player',
            className: r.ClassName || 'N/A',
            dateEnrolled: r.dateEnrolled ? r.dateEnrolled.toISOString().split('T')[0] : 'N/A',
            status: r.Status
        }));

        res.json({ 
            reports: formatted,
            kpis: {
                totalEnrollments: data.kpis.total,
                activeEnrollments: data.kpis.active,
                cancelledEnrollments: data.kpis.cancelled,
                mostPopularClass: data.popularClasses.length > 0 ? data.popularClasses[0].name : "N/A"
            },
            charts: {
                enrollmentsPerClass: data.popularClasses,
                dailyEnrollments: data.dailyEnrollments
            },
            metadata: { classes: classesList }
        });
    } catch (err) {
        next(err);
    }
};

