const { pool } = require("../../config/db");
const classModel = require("../../models/class.model");
const courtModel = require("../../models/court.model");
const coachModel = require("../../models/coach.model");

// get list of courts that are free for a specific time and sport
exports.getAvailableCourts = async (req, res, next) => {
    try {
        const { sportId, scheduleType, startTime, endTime, weekdays, oneTimeDate, startDate, excludeClassId } = req.query;

        // validate required input parameters
        if (!sportId || !scheduleType || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // handle weekly schedule day formatting
        let parsedWeekdays = [];
        if (scheduleType === "WEEKLY") {
            if (!startDate || !weekdays) return res.status(400).json({ message: "startDate and weekdays are required for WEEKLY" });
            try {
                parsedWeekdays = Array.isArray(weekdays) ? weekdays.map(Number) : JSON.parse(weekdays);
                if (!Array.isArray(parsedWeekdays)) parsedWeekdays = [Number(parsedWeekdays)];
            } catch (e) {
                parsedWeekdays = [Number(weekdays)];
            }
        } else if (scheduleType === "ONE_TIME") {
            if (!oneTimeDate) return res.status(400).json({ message: "oneTimeDate is required for ONE_TIME" });
        }

        // fetch courts that support the selected sport
        const courts = await courtModel.listBySport(sportId);
        if (courts.length === 0) return res.json({ availableCourts: [] });

        // check for conflicts with existing classes
        const conflictingCourtIds = await classModel.checkCourtConflicts(pool, {
            scheduleType,
            weekdays: parsedWeekdays,
            oneTimeDate: oneTimeDate || null,
            startTime,
            endTime,
            startDate: startDate || null,
            excludeClassId: excludeClassId ? Number(excludeClassId) : 0
        });

        // filter out courts that are already booked
        const safeCourts = courts.filter(c => !conflictingCourtIds.has(c.CourtID));
        res.json({ availableCourts: safeCourts });

    } catch (err) {
        next(err);
    }
};

// get list of all coaches for dropdown selection
exports.getCoaches = async (req, res, next) => {
    try {
        // fetch coaches and their sports from database
        const coaches = await coachModel.listAllForSelection();
        const mapped = coaches.map(c => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            sports: c.sports ? c.sports.split(',') : []
        }));
        res.json({ coaches: mapped });
    } catch (err) {
        next(err);
    }
};

// get list of all coaching classes for administrative management
exports.getClasses = async (req, res, next) => {
    try {
        // fetch all classes with coach and court info
        const classes = await classModel.listAllClasses();
        const mapped = classes.map(c => ({
            ...c,
            id: `CLS-${String(c.id).padStart(6, '0')}`,
            rawId: c.id,
            coachIdStr: `COA-${String(c.coachId).padStart(6, '0')}`,
            days: c.days ? c.days.split(',').map(Number) : [],
            courtName: c.courtNames,
            courtIds: c.courtIds ? c.courtIds.split(',').map(Number) : []
        }));
        res.json({ classes: mapped });
    } catch (err) {
        next(err);
    }
};

// create a new coaching class and generate its schedule
exports.createClass = async (req, res, next) => {
    // get database connection for transaction
    const conn = await pool.getConnection();
    try {
        const {
            title, sportId, coachId, courtIds, capacity, fee,
            billingType, scheduleType, startDate, oneTimeDate, startTime, endTime, weekdays
        } = req.body;

        // validate all required fields
        if (!title || !sportId || !coachId || !courtIds || !Array.isArray(courtIds) || courtIds.length === 0 || !capacity || fee === undefined || !billingType || !scheduleType || !startDate || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const conflictOpts = { scheduleType, weekdays, oneTimeDate, startTime, endTime, startDate };
        
        // check for court booking conflicts
        const conflictingCourts = await classModel.checkCourtConflicts(conn, conflictOpts);
        const busyCourts = courtIds.filter(id => conflictingCourts.has(Number(id)));
        if (busyCourts.length > 0) return res.status(409).json({ message: `Conflict: Courts ${busyCourts.join(', ')} are booked.` });

        // check if coach is already busy at this time
        const conflictingCoaches = await classModel.checkCoachConflicts(conn, conflictOpts);
        if (conflictingCoaches.has(Number(coachId))) return res.status(409).json({ message: "Conflict: Coach is busy." });

        // start transaction and save class to database
        await conn.beginTransaction();
        const result = await classModel.createClass(req.body, conn);
        await conn.commit();

        res.status(201).json({ message: "Class created successfully", ...result });
    } catch (err) {
        // rollback changes on error
        await conn.rollback();
        next(err);
    } finally {
        // release connection
        conn.release();
    }
};

// update class details and handle schedule changes
exports.updateClass = async (req, res, next) => {
    // get database connection for transaction
    const conn = await pool.getConnection();
    try {
        const classId = Number(req.params.classId);
        const { scheduleType, weekdays, oneTimeDate, startTime, endTime, startDate, coachId, courtIds } = req.body;

        // find existing class record
        const current = await classModel.findById(classId, conn);
        if (!current) return res.status(404).json({ message: "Class not found" });

        const conflictOpts = { scheduleType, weekdays, oneTimeDate, startTime, endTime, startDate, excludeClassId: classId };
        
        // check for court conflicts excluding current class
        const conflictingCourts = await classModel.checkCourtConflicts(conn, conflictOpts);
        const busyCourts = courtIds.filter(id => conflictingCourts.has(Number(id)));
        if (busyCourts.length > 0) return res.status(409).json({ message: `Conflict: Courts ${busyCourts.join(', ')} are booked.` });

        // check for coach conflicts excluding current class
        const conflictingCoaches = await classModel.checkCoachConflicts(conn, conflictOpts);
        if (conflictingCoaches.has(Number(coachId))) return res.status(409).json({ message: "Conflict: Coach is busy." });

        // determine if schedule logic needs to be regenerated
        const oldDays = (current.weekdays || "").split(',').map(Number).sort().join(',');
        const newDays = Array.isArray(weekdays) ? [...weekdays].map(Number).sort().join(',') : "";
        const scheduleChanged = 
            current.ScheduleType !== scheduleType || current.StartTime !== startTime || current.EndTime !== endTime ||
            (scheduleType === 'WEEKLY' && (current.StartDate?.toISOString().split('T')[0] !== startDate || oldDays !== newDays)) ||
            (scheduleType === 'ONE_TIME' && current.OneTimeDate?.toISOString().split('T')[0] !== oneTimeDate);

        // start transaction and update class
        await conn.beginTransaction();
        await classModel.updateClass(classId, { ...req.body, scheduleChanged }, conn);
        await conn.commit();

        res.json({ message: "Class updated successfully" });
    } catch (err) {
        // rollback changes on error
        await conn.rollback();
        next(err);
    } finally {
        // release connection
        conn.release();
    }
};

// stop new enrollments for a class
exports.deactivateClass = async (req, res, next) => {
    try {
        // update status in database
        const success = await classModel.updateStatus(req.params.classId, 'DEACTIVATED');
        if (!success) return res.status(404).json({ message: "Class not found" });
        res.json({ message: "Class deactivated successfully" });
    } catch (err) {
        next(err);
    }
};

// allow new enrollments for a class
exports.activateClass = async (req, res, next) => {
    try {
        // update status in database
        const success = await classModel.updateStatus(req.params.classId, 'ACTIVE');
        if (!success) return res.status(404).json({ message: "Class not found" });
        res.json({ message: "Class activated successfully" });
    } catch (err) {
        next(err);
    }
};

// get all class sessions for the administrative calendar
exports.listSessions = async (req, res, next) => {
    try {
        // fetch session data from database
        const sessions = await classModel.listSessionsForCalendar();
        
        // format data for frontend calendar display
        const mapped = sessions.map(s => {
            const startDate = new Date(s.date);
            const yyyy = startDate.getFullYear();
            const mm = String(startDate.getMonth() + 1).padStart(2, '0');
            const dd = String(startDate.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const isCancelled = s.status === 'CANCELLED';

            return {
                id: `SES-${String(s.id).padStart(6, '0')}`,
                rawId: s.id,
                title: `${isCancelled ? '[CANCELLED] ' : ''}${s.title} (${s.sportName})`,
                start: `${dateStr}T${s.startTime}:00`,
                end: `${dateStr}T${s.endTime}:00`,
                backgroundColor: isCancelled ? '#e2e8f0' : (s.color || "#1976d2"),
                borderColor: isCancelled ? '#cbd5e1' : (s.color || "#1976d2"),
                textColor: isCancelled ? '#64748b' : '#ffffff',
                extendedProps: {
                    type: 'CLASS', status: s.status, sport: s.sportName,
                    coach: `${s.coachFirst} ${s.coachLast}`, coachPhone: s.coachPhone,
                    court: s.courts, time: `${s.startTime} - ${s.endTime}`
                }
            };
        });
        res.json({ sessions: mapped });
    } catch (err) {
        next(err);
    }
};

// get list of coach cancellations that the admin hasn't seen yet
exports.getRecentCancellations = async (req, res, next) => {
    try {
        const rows = await classModel.listRecentCancellations();
        res.json({ cancellations: rows });
    } catch (err) {
        next(err);
    }
};

// get the full audit log of all cancellations ever made
exports.getCancelledSessionsHistory = async (req, res, next) => {
    try {
        const rows = await classModel.listCancelledHistory();
        res.json({ history: rows });
    } catch (err) {
        next(err);
    }
};

// mark a cancellation alert as read so it disappears from the admin dashboard
exports.acknowledgeCancellation = async (req, res, next) => {
    try {
        const sessionId = Number(req.params.sessionId);
        const success = await classModel.acknowledgeCancellation(sessionId);
        if (!success) return res.status(404).json({ message: "Session not found or already acknowledged" });
        res.json({ message: "Cancellation acknowledged" });
    } catch (err) {
        next(err);
    }
};

