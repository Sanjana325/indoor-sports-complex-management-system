const attendanceModel = require("../../models/attendance.model");
const classModel = require("../../models/class.model");
const { pool } = require("../../config/db");

// get list of active classes for the staff/admin attendance selector
exports.getClassesForAttendance = async (req, res, next) => {
    try {
        const rows = await attendanceModel.listClassesForAttendance();
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

// get student list and current attendance marks for a specific class session
exports.getSessionAttendance = async (req, res, next) => {
    try {
        const { classId, sessionDate } = req.query;
        if (!classId || !sessionDate) {
            return res.status(400).json({ message: "classId and sessionDate are required" });
        }

        // find session on the specific date
        const session = await classModel.findSessionByClassAndDate(classId, sessionDate);
        if (!session) {
            return res.json({
                session: null,
                students: [],
                message: "No session scheduled for this class on the selected date."
            });
        }

        // fetch students and their attendance status
        const students = await attendanceModel.findSessionAttendance(session.SessionID, classId);
        const studentList = students.map(s => ({
            enrollmentId: `ENR-${String(s.EnrollmentID).padStart(6, '0')}`,
            rawEnrollmentId: s.EnrollmentID,
            userId: s.UserID,
            name: `${s.FirstName} ${s.LastName}`,
            status: s.AttendanceStatus,
            markedAt: s.MarkedAt
        }));

        res.json({
            session: {
                sessionId: session.SessionID,
                classId: session.ClassID,
                sessionDate: session.SessionDate,
                startTime: session.StartTime,
                endTime: session.EndTime,
                status: session.Status
            },
            students: studentList
        });
    } catch (err) {
        next(err);
    }
};

// save attendance records (Present/Absent) for a group of students
exports.markAttendance = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const { sessionId, marks } = req.body;
        if (!sessionId || !Array.isArray(marks) || marks.length === 0) {
            return res.status(400).json({ message: "sessionId and marks[] are required" });
        }

        const [sessionRows] = await conn.query("SELECT SessionID FROM classsession WHERE SessionID = ?", [sessionId]);
        if (sessionRows.length === 0) {
            conn.release();
            return res.status(404).json({ message: "Session not found" });
        }

        // update attendance status in bulk using a transaction
        await conn.beginTransaction();
        await attendanceModel.markBulk(sessionId, marks, conn);
        await conn.commit();

        res.json({ message: "Attendance saved successfully", count: marks.length });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

