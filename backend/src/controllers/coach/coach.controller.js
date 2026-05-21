const coachModel = require("../../models/coach.model");
const classModel = require("../../models/class.model");
const enrollmentModel = require("../../models/enrollment.model");
const sportModel = require("../../models/sport.model");
const attendanceModel = require("../../models/attendance.model");
const emailService = require("../../services/email.service");

// get all classes assigned to the logged-in coach
exports.getMyClasses = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        // find coach profile linked to user
        const coachId = await coachModel.getCoachIdByUserId(userId);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found." });

        const classes = await classModel.listByCoachId(coachId);
        const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        // format output with day names and court details
        const mapped = classes.map(c => ({
            ...c,
            days: c.scheduleType === 'WEEKLY' && c.days ? c.days.split(',').map(d => dayMap[Number(d)]) : [],
            courtName: c.courtNames,
            courtIds: c.courtIds ? c.courtIds.split(',').map(Number) : []
        }));

        res.json({ classes: mapped });
    } catch (err) {
        next(err);
    }
};

// get coaching sessions for a specific day
exports.getSessionsForDate = async (req, res, next) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: "Date is required" });

        const coachId = await coachModel.getCoachIdByUserId(req.user.UserID);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found" });

        const sessions = await classModel.findSessionsByCoach(coachId, { date });
        res.json({ sessions });
    } catch (err) {
        next(err);
    }
};

// cancel a session and notify all students via email
exports.cancelSession = async (req, res, next) => {
    try {
        const { sessionId, reason } = req.body;
        if (!sessionId) return res.status(400).json({ message: "SessionID is required" });

        const coachId = await coachModel.getCoachIdByUserId(req.user.UserID);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found" });

        // verify coach owns this session before cancelling
        const session = await classModel.findSessionWithClassDetails(sessionId, coachId);
        if (!session) return res.status(403).json({ message: "Access denied or session not found" });

        // update status in database
        await classModel.updateSessionStatus(sessionId, 'CANCELLED');
        res.json({ message: "Session cancelled successfully" });

        // send cancellation alert to each student
        const students = await enrollmentModel.listStudentEmails(session.ClassID);
        if (students.length > 0) {
            Promise.allSettled(students.map(student => {
                if (student.Email) {
                    return emailService.sendSessionCancelledEmail({
                        toEmail: student.Email,
                        toName: `${student.FirstName} ${student.LastName}`.trim(),
                        className: session.Title,
                        sessionDate: session.SessionDate,
                        startTime: session.StartTime,
                        endTime: session.EndTime
                    });
                }
                return Promise.resolve();
            }));
        }
    } catch (err) {
        next(err);
    }
};

// get sessions and sports for the coach's dashboard calendar
exports.getCalendarData = async (req, res, next) => {
    try {
        const coachId = await coachModel.getCoachIdByUserId(req.user.UserID);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found." });

        const sports = await sportModel.listByCoachId(coachId);
        const sessions = await classModel.findSessionsByCoach(coachId);

        // format session data for fullcalendar library
        const formattedSessions = sessions.map(s => {
            const isCancelled = s.status === 'CANCELLED';
            return {
                id: String(s.id),
                title: `${isCancelled ? '[CANCELLED] ' : ''}${s.className}`,
                start: `${s.date}T${s.startTime}:00`,
                end: `${s.date}T${s.endTime}:00`,
                backgroundColor: isCancelled ? '#e2e8f0' : (s.sportColor || "#1976d2"),
                borderColor: isCancelled ? '#cbd5e1' : (s.sportColor || "#1976d2"),
                textColor: isCancelled ? '#64748b' : '#ffffff',
                extendedProps: {
                    type: "SESSION", sport: s.sport, court: s.court || "N/A",
                    time: `${s.startTime} - ${s.endTime}`, status: s.status,
                    coach: `${s.coachFirst} ${s.coachLast}`, coachPhone: s.coachPhone
                }
            };
        });

        res.json({ sessions: formattedSessions, sports });
    } catch (err) {
        next(err);
    }
};

// get a list of all cancelled sessions for the coach
exports.getCancelledSessions = async (req, res, next) => {
    try {
        const coachId = await coachModel.getCoachIdByUserId(req.user.UserID);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found." });

        const sessions = await classModel.findSessionsByCoach(coachId, { status: 'CANCELLED' });
        res.json({ sessions });
    } catch (err) {
        next(err);
    }
};

// get all students registered for a specific class
exports.getEnrolledStudents = async (req, res, next) => {
    try {
        const { classId } = req.params;
        const coachId = await coachModel.getCoachIdByUserId(req.user.UserID);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found" });

        // verify ownership
        const classInfo = await classModel.findById(classId);
        if (!classInfo || classInfo.CoachID !== coachId) return res.status(403).json({ message: "Access denied" });

        const students = await enrollmentModel.listStudentsByClass(classId);
        res.json({ students });
    } catch (err) {
        next(err);
    }
};

// get the attendance list for a specific session
exports.getSessionAttendance = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const coachId = await coachModel.getCoachIdByUserId(req.user.UserID);
        if (!coachId) return res.status(404).json({ message: "Coach profile not found" });

        // verify coach owns this session
        const session = await classModel.findSessionWithClassDetails(sessionId, coachId);
        if (!session) return res.status(403).json({ message: "Access denied" });

        // fetch student attendance records
        const students = await attendanceModel.findSessionAttendance(sessionId, session.ClassID);
        const attendance = students.map(s => ({
            studentId: s.UserID,
            FirstName: s.FirstName,
            LastName: s.LastName,
            status: s.AttendanceStatus
        }));
        res.json({ attendance });
    } catch (err) {
        next(err);
    }
};

