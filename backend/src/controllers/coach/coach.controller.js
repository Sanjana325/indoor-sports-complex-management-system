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
            SELECT cs.SessionID 
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
    } catch (err) {
        console.error("[cancelSession] Error:", err);
        next(err);
    }
};
