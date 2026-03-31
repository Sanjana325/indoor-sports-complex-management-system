const { pool } = require("../../config/db");

// Get all enrollments for admin
exports.listEnrollments = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.EnrollmentID, e.Status AS EnrollmentStatus, e.EnrolledAt,
                    u.FirstName, u.LastName,
                    c.Title AS ClassName, c.BillingType,
                    em.PeriodMonth, em.Status AS FeeStatus
             FROM enrollment e
             JOIN useraccount u ON e.UserID = u.UserID
             JOIN class c ON e.ClassID = c.ClassID
             LEFT JOIN (
                 SELECT EnrollmentID, PeriodMonth, Status
                 FROM enrollmentmonth em1
                 WHERE EnrollmentMonthID = (
                     SELECT MAX(EnrollmentMonthID)
                     FROM enrollmentmonth em2
                     WHERE em2.EnrollmentID = em1.EnrollmentID
                 )
             ) em ON e.EnrollmentID = em.EnrollmentID
             ORDER BY e.EnrolledAt DESC`
        );

        const enrollments = rows.map(r => {
            const dateStr = r.EnrolledAt
                ? new Date(r.EnrolledAt).toISOString().slice(0, 10)
                : "—";

            let currentPeriod = "—";
            if (r.BillingType === 'ONE_TIME') {
                currentPeriod = "One-time";
            } else if (r.PeriodMonth) {
                const d = new Date(r.PeriodMonth);
                if (!Number.isNaN(d.getTime())) {
                    currentPeriod = d.toISOString().slice(0, 7); // "YYYY-MM"
                }
            }

            return {
                id: r.EnrollmentID,
                enrollmentId: `ENR-${String(r.EnrollmentID).padStart(6, '0')}`,
                playerName: `${r.FirstName} ${r.LastName}`,
                className: r.ClassName,
                billingType: r.BillingType,
                currentPeriod: currentPeriod,
                currentFeeStatus: r.FeeStatus || '—',
                enrolledAt: dateStr,
                status: r.EnrollmentStatus
            };
        });

        res.json({ enrollments });
    } catch (err) {
        next(err);
    }
};

// Cancel an enrollment
exports.cancelEnrollment = async (req, res, next) => {
    try {
        const enrollmentId = req.params.id;

        const [enrRes] = await pool.query("SELECT * FROM enrollment WHERE EnrollmentID = ?", [enrollmentId]);
        if (enrRes.length === 0) {
            return res.status(404).json({ message: "Enrollment not found" });
        }
        
        await pool.query(
            "UPDATE enrollment SET Status = 'CANCELLED' WHERE EnrollmentID = ?",
            [enrollmentId]
        );

        res.json({ message: "Enrollment cancelled successfully" });
    } catch (err) {
        next(err);
    }
};
