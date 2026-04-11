const { pool } = require("../../config/db");
const coachModel = require("../../models/coach.model");

exports.getMyClasses = async (req, res, next) => {
    try {
        const userId = req.user.UserID;

        // 1. Get CoachID for this UserID
        const coachId = await coachModel.getCoachIdByUserId(userId);
        if (!coachId) {
            return res.status(404).json({ message: "Coach profile not found for this user." });
        }

        // 2. Fetch all classes for this coach
        const [classes] = await pool.query(`
            SELECT 
                c.ClassID as id,
                s.SportName as sport,
                c.Title as className,
                c.CoachID as coachId,
                CONCAT(u.FirstName, ' ', u.LastName) as coachName,
                sch.ScheduleType as scheduleType,
                sch.OneTimeDate as oneTimeDate,
                DATE_FORMAT(sch.StartTime, '%H:%i') as startTime,
                DATE_FORMAT(sch.EndTime, '%H:%i') as endTime,
                c.Capacity as capacity,
                c.Fee as fee,
                c.CreatedAt as createdAt,
                c.StartDate as startDate,
                c.Status as status,
                GROUP_CONCAT(DISTINCT cd.Weekday) as days,
                GROUP_CONCAT(DISTINCT ct.CourtName ORDER BY ct.CourtName SEPARATOR ', ') as courtNames,
                GROUP_CONCAT(DISTINCT ct.CourtID) as courtIds,
                (SELECT COUNT(*) FROM enrollment ce WHERE ce.ClassID = c.ClassID AND ce.Status = 'ENROLLED') as enrolledCount
            FROM class c
            JOIN sport s ON c.SportID = s.SportID
            JOIN coach co ON c.CoachID = co.CoachID
            JOIN useraccount u ON co.UserID = u.UserID
            LEFT JOIN class_court cc ON c.ClassID = cc.ClassID
            LEFT JOIN court ct ON cc.CourtID = ct.CourtID
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            LEFT JOIN classscheduleday cd ON sch.ScheduleID = cd.ScheduleID
            WHERE c.CoachID = ?
            GROUP BY c.ClassID, sch.ScheduleType, sch.OneTimeDate, sch.StartTime, sch.EndTime, sch.ScheduleID
            ORDER BY c.CreatedAt DESC
        `, [coachId]);

        // Map Weekday ints to Strings
        const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const mapped = classes.map(c => ({
            ...c,
            days: c.scheduleType === 'WEEKLY' && c.days
                ? c.days.split(',').map(d => dayMap[Number(d)])
                : [],
            courtName: c.courtNames, // For UI table
            courtIds: c.courtIds ? c.courtIds.split(',').map(Number) : []
        }));

        res.json({ classes: mapped });
    } catch (err) {
        console.error("[getMyClasses] Error:", err);
        next(err);
    }
};

exports.getSessionsForDate = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const { date } = req.query;

        if (!date) return res.status(400).json({ message: "Date is required" });

        const coachId = await coachModel.getCoachIdByUserId(userId);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found" });

        const [sessions] = await pool.query(`
            SELECT 
                cs.SessionID as id,
                cs.ClassID as classId,
                c.Title as className,
                s.SportName as sport,
                DATE_FORMAT(cs.StartTime, '%H:%i') as startTime,
                DATE_FORMAT(cs.EndTime, '%H:%i') as endTime,
                cs.Status as status
            FROM classsession cs
            JOIN class c ON cs.ClassID = c.ClassID
            JOIN sport s ON c.SportID = s.SportID
            WHERE c.CoachID = ? AND cs.SessionDate = ?
        `, [coachId, date]);

        res.json({ sessions });
    } catch (err) {
        console.error("[getSessionsForDate] Error:", err);
        next(err);
    }
};

exports.cancelSession = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const { sessionId, reason } = req.body;

        if (!sessionId) return res.status(400).json({ message: "SessionID is required" });

        const coachId = await coachModel.getCoachIdByUserId(userId);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found" });

        // 1. Verify this session belongs to a class coached by this coach
        const [rows] = await pool.query(`
            SELECT cs.SessionID, cs.ClassID, c.Title, 
                   DATE_FORMAT(cs.SessionDate, '%Y-%m-%d') as SessionDate,
                   DATE_FORMAT(cs.StartTime, '%H:%i') as StartTime,
                   DATE_FORMAT(cs.EndTime, '%H:%i') as EndTime
            FROM classsession cs
            JOIN class c ON cs.ClassID = c.ClassID
            WHERE cs.SessionID = ? AND c.CoachID = ?
            LIMIT 1
        `, [sessionId, coachId]);

        if (rows.length === 0) {
            return res.status(403).json({ message: "You do not have permission to cancel this session" });
        }

        // 2. Update status to CANCELLED
        await pool.query(`
            UPDATE classsession 
            SET Status = 'CANCELLED' 
            WHERE SessionID = ?
        `, [sessionId]);

        res.json({ message: "Session cancelled successfully" });

        // 3. Fire-and-forget: Notify enrolled students
        try {
            const classRow = rows[0];
            const [students] = await pool.query(`
                SELECT u.Email, u.FirstName, u.LastName
                FROM enrollment e
                JOIN useraccount u ON e.UserID = u.UserID
                WHERE e.ClassID = ? AND e.Status = 'ENROLLED'
            `, [classRow.ClassID]);

            if (students.length > 0) {
                const emailService = require("../../services/email.service");
                
                Promise.allSettled(students.map(student => {
                    if (student.Email) {
                        return emailService.sendSessionCancelledEmail({
                            toEmail: student.Email,
                            toName: (student.FirstName + " " + student.LastName).trim(),
                            className: classRow.Title,
                            sessionDate: classRow.SessionDate,
                            startTime: classRow.StartTime,
                            endTime: classRow.EndTime
                        });
                    }
                    return Promise.resolve();
                })).then(results => {
                    const failed = results.filter(r => r.status === 'rejected');
                    if (failed.length > 0) {
                        console.error("Failed to send " + failed.length + " cancellation emails.");
                    }
                });
            }
        } catch (err) {
            console.error("Error triggering cancellation emails:", err);
        }
    } catch (err) {
        console.error("[cancelSession] Error:", err);
        next(err);
    }
};

exports.getCalendarData = async (req, res, next) => {
    try {
        const userId = req.user.UserID;

        const coachId = await coachModel.getCoachIdByUserId(userId);
        if (!coachId) {
            return res.status(404).json({ message: "Coach profile not found for this user." });
        }

        // 1. Get Coach's Sports
        const [sports] = await pool.query(`
            SELECT s.SportID, s.SportName, s.ColorCode
            FROM sport s
            JOIN coachsport cs ON s.SportID = cs.SportID
            WHERE cs.CoachID = ?
        `, [coachId]);

        // 2. Get Coach's Sessions
        const [sessions] = await pool.query(`
            SELECT 
                cs.SessionID as id,
                c.Title as className,
                s.SportName as sport,
                s.ColorCode as sportColor,
                DATE_FORMAT(cs.SessionDate, '%Y-%m-%d') as date,
                DATE_FORMAT(cs.StartTime, '%H:%i') as startTime,
                DATE_FORMAT(cs.EndTime, '%H:%i') as endTime,
                ct.CourtName as court,
                cs.Status as status,
                u.FirstName as coachFirst,
                u.LastName as coachLast,
                u.PhoneNumber as coachPhone
            FROM classsession cs
            JOIN class c ON cs.ClassID = c.ClassID
            JOIN sport s ON c.SportID = s.SportID
            JOIN coach co ON c.CoachID = co.CoachID
            JOIN useraccount u ON co.UserID = u.UserID
            LEFT JOIN class_court cc ON c.ClassID = cc.ClassID
            LEFT JOIN court ct ON cc.CourtID = ct.CourtID
            WHERE c.CoachID = ?
            ORDER BY cs.SessionDate ASC, cs.StartTime ASC
        `, [coachId]);

        // Map sessions for FullCalendar
        const formattedSessions = sessions.map(s => {
            const isCancelled = s.status === 'CANCELLED';
            const titlePrefix = isCancelled ? '[CANCELLED] ' : '';

            return {
                id: String(s.id),
                title: `${titlePrefix}${s.className}`,
                start: `${s.date}T${s.startTime}:00`,
                end: `${s.date}T${s.endTime}:00`,
                backgroundColor: isCancelled ? '#e2e8f0' : (s.sportColor || "#1976d2"),
                borderColor: isCancelled ? '#cbd5e1' : (s.sportColor || "#1976d2"),
                textColor: isCancelled ? '#64748b' : '#ffffff',
                extendedProps: {
                    type: "SESSION",
                    sport: s.sport,
                    court: s.court || "N/A",
                    time: `${s.startTime} - ${s.endTime}`,
                    status: s.status,
                    coach: `${s.coachFirst} ${s.coachLast}`,
                    coachPhone: s.coachPhone
                }
            };
        });

        res.json({ 
            sessions: formattedSessions,
            sports: (sports || [])
        });
    } catch (err) {
        console.error("[getCalendarData] Error:", err);
        next(err);
    }
};

exports.getCancelledSessions = async (req, res, next) => {
    try {
        const userId = req.user.UserID;

        const coachId = await coachModel.getCoachIdByUserId(userId);
        if (!coachId) {
            return res.status(404).json({ message: "Coach profile not found for this user." });
        }

        const [sessions] = await pool.query(`
            SELECT 
                cs.SessionID as id,
                c.Title as className,
                s.SportName as sport,
                DATE_FORMAT(cs.SessionDate, '%Y-%m-%d') as date,
                DATE_FORMAT(cs.StartTime, '%H:%i') as startTime,
                DATE_FORMAT(cs.EndTime, '%H:%i') as endTime,
                cs.Status as status
            FROM classsession cs
            JOIN class c ON cs.ClassID = c.ClassID
            JOIN sport s ON c.SportID = s.SportID
            WHERE c.CoachID = ? AND cs.Status = 'CANCELLED'
            ORDER BY cs.SessionDate DESC, cs.StartTime DESC
        `, [coachId]);

        res.json({ sessions });
    } catch (err) {
        console.error("[getCancelledSessions] Error:", err);
        next(err);
    }
};

exports.getEnrolledStudents = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const { classId } = req.params;

        const coachId = await coachModel.getCoachIdByUserId(userId);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found" });

        // 1. Verify class belongs to this coach
        const [classRows] = await pool.query(
            "SELECT ClassID FROM class WHERE ClassID = ? AND CoachID = ?",
            [classId, coachId]
        );
        if (classRows.length === 0) return res.status(403).json({ message: "Access denied" });

        // 2. Fetch enrolled students
        const [students] = await pool.query(`
            SELECT 
                u.UserID as id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.PhoneNumber,
                e.EnrolledAt
            FROM enrollment e
            JOIN useraccount u ON e.UserID = u.UserID
            WHERE e.ClassID = ? AND e.Status = 'ENROLLED'
            ORDER BY u.FirstName ASC
        `, [classId]);

        res.json({ students });
    } catch (err) {
        console.error("[getEnrolledStudents] Error:", err);
        next(err);
    }
};

exports.getSessionAttendance = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const { sessionId } = req.params;

        const coachId = await coachModel.getCoachIdByUserId(userId);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found" });

        // 1. Verify session belongs to this coach's class
        const [sessRows] = await pool.query(`
            SELECT cs.SessionID, cs.ClassID 
            FROM classsession cs
            JOIN class c ON cs.ClassID = c.ClassID
            WHERE cs.SessionID = ? AND c.CoachID = ?
        `, [sessionId, coachId]);
        if (sessRows.length === 0) return res.status(403).json({ message: "Access denied" });

        const classId = sessRows[0].ClassID;

        // 2. Fetch all enrolled students and their attendance status for THIS session
        const [attendance] = await pool.query(`
            SELECT 
                u.UserID as studentId,
                u.FirstName,
                u.LastName,
                COALESCE(a.Status, 'NOT_MARKED') as status
            FROM enrollment e
            JOIN useraccount u ON e.UserID = u.UserID
            LEFT JOIN attendance a ON e.EnrollmentID = a.EnrollmentID AND a.SessionID = ?
            WHERE e.ClassID = ? AND e.Status = 'ENROLLED'
            ORDER BY u.FirstName ASC
        `, [sessionId, classId]);

        res.json({ attendance });
    } catch (err) {
        console.error("[getSessionAttendance] Error:", err);
        next(err);
    }
};
