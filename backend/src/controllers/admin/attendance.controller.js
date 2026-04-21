const { pool } = require("../../config/db");

// ─── GET /api/admin/attendance/classes ────────────────────────────
// Returns active classes for the attendance class-selector dropdown
exports.getClassesForAttendance = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT c.ClassID, c.Title,
                    s.SportName,
                    u.FirstName AS CoachFirstName, u.LastName AS CoachLastName
             FROM class c
             JOIN sport s   ON c.SportID = s.SportID
             JOIN coach co  ON c.CoachID = co.CoachID
             JOIN useraccount u ON co.UserID = u.UserID
             WHERE c.Status = 'ACTIVE'
             ORDER BY c.Title`
        );

        const classes = rows.map(r => ({
            classId: r.ClassID,
            title: r.Title,
            sport: r.SportName,
            coach: `${r.CoachFirstName} ${r.CoachLastName}`
        }));

        res.json({ classes });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/admin/attendance?classId=&sessionDate= ─────────────
// For a given class + date, return enrolled students and their
// current attendance status for that session.
exports.getSessionAttendance = async (req, res, next) => {
    try {
        const { classId, sessionDate } = req.query;

        if (!classId || !sessionDate) {
            return res.status(400).json({ message: "classId and sessionDate are required" });
        }

        // 1. Find the class-session for this class + date
        const [sessions] = await pool.query(
            `SELECT SessionID, ClassID, SessionDate, StartTime, EndTime, Status
             FROM classsession
             WHERE ClassID = ? AND SessionDate = ?`,
            [classId, sessionDate]
        );

        if (sessions.length === 0) {
            return res.json({
                session: null,
                students: [],
                message: "No session scheduled for this class on the selected date."
            });
        }

        const session = sessions[0];

        // If session is cancelled, still return students but flag it
        const sessionInfo = {
            sessionId: session.SessionID,
            classId: session.ClassID,
            sessionDate: session.SessionDate,
            startTime: session.StartTime,
            endTime: session.EndTime,
            status: session.Status
        };

        // 2. Get enrolled students + any existing attendance marks
        const [students] = await pool.query(
            `SELECT e.EnrollmentID,
                    u.UserID, u.FirstName, u.LastName,
                    COALESCE(a.Status, 'NOT_MARKED') AS AttendanceStatus,
                    a.MarkedAt
             FROM enrollment e
             JOIN useraccount u ON e.UserID = u.UserID
             LEFT JOIN attendance a ON a.EnrollmentID = e.EnrollmentID
                                    AND a.SessionID = ?
             WHERE e.ClassID = ? AND e.Status = 'ENROLLED'
             ORDER BY u.FirstName, u.LastName`,
            [session.SessionID, classId]
        );

        const studentList = students.map(s => ({
            enrollmentId: `ENR-${String(s.EnrollmentID).padStart(6, '0')}`,
            rawEnrollmentId: s.EnrollmentID,
            userId: s.UserID,
            name: `${s.FirstName} ${s.LastName}`,
            status: s.AttendanceStatus,
            markedAt: s.MarkedAt
        }));

        res.json({ session: sessionInfo, students: studentList });
    } catch (err) {
        next(err);
    }
};

// ─── POST /api/admin/attendance/mark ─────────────────────────────
// Bulk upsert attendance marks for a session.
// Body: { sessionId: number, marks: [{ enrollmentId, status }] }
exports.markAttendance = async (req, res, next) => {
    try {
        const { sessionId, marks } = req.body;

        if (!sessionId || !Array.isArray(marks) || marks.length === 0) {
            return res.status(400).json({ message: "sessionId and marks[] are required" });
        }

        // Validate session exists
        const [sessionRows] = await pool.query(
            "SELECT SessionID, Status FROM classsession WHERE SessionID = ?",
            [sessionId]
        );
        if (sessionRows.length === 0) {
            return res.status(404).json({ message: "Session not found" });
        }

        // Upsert each mark using INSERT ... ON DUPLICATE KEY UPDATE
        // The unique key (EnrollmentID, SessionID) prevents duplicates
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            for (const mark of marks) {
                if (!mark.enrollmentId || !["PRESENT", "ABSENT"].includes(mark.status)) {
                    await conn.rollback();
                    return res.status(400).json({
                        message: `Invalid mark: enrollmentId=${mark.enrollmentId}, status=${mark.status}`
                    });
                }

                await conn.query(
                    `INSERT INTO attendance (EnrollmentID, SessionID, Status, MarkedAt)
                     VALUES (?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE Status = VALUES(Status), MarkedAt = NOW()`,
                    [mark.enrollmentId, sessionId, mark.status]
                );
            }

            await conn.commit();
            res.json({ message: "Attendance saved successfully", count: marks.length });
        } catch (txErr) {
            await conn.rollback();
            throw txErr;
        } finally {
            conn.release();
        }
    } catch (err) {
        next(err);
    }
};
