const { pool } = require("../../config/db");

function getWeeklySessionDates(startDateStr, weekdays, weeks = 4) {
    const dates = [];
    const [year, month, day] = startDateStr.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, day));

    const totalDays = weeks * 7;
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(Date.UTC(year, month - 1, day + i));
        if (weekdays.includes(d.getUTCDay())) {
            dates.push(d.toISOString().split('T')[0]);
        }
    }
    return dates;
}

/**
 * Returns a Set<CourtID> of courts that conflict with the given schedule.
 * Checks directly against class schedules (not pre-generated sessions), so it
 * is accurate indefinitely — not limited to a 4-week window.
 * Only ACTIVE classes are considered. DEACTIVATED classes are ignored.
 *
 * Overlap rule: newStart < existingEnd  AND  newEnd > existingStart
 *
 * @param {object} conn  - mysql2 connection or pool
 * @param {object} opts
 * @param {'WEEKLY'|'ONE_TIME'} opts.scheduleType
 * @param {number[]} [opts.weekdays]   - required when scheduleType='WEEKLY' (0=Sun…6=Sat)
 * @param {string}  [opts.oneTimeDate] - required when scheduleType='ONE_TIME' (YYYY-MM-DD)
 * @param {string}  opts.startTime     - 'HH:mm'
 * @param {string}  opts.endTime       - 'HH:mm'
 * @param {number}  [opts.excludeClassId] - optional: skip this classId (used when editing)
 */
async function getConflictingCourtIds(conn, { scheduleType, weekdays, oneTimeDate, startTime, endTime, excludeClassId }) {
    const conflicting = new Set();
    const excludeId = excludeClassId || 0; // 0 will never match a real ClassID

    if (scheduleType === 'WEEKLY') {
        if (!weekdays || weekdays.length === 0) return conflicting;

        // 1. WEEKLY new class vs existing WEEKLY active classes — any shared weekday + time overlap
        const [rows1] = await conn.query(`
            SELECT DISTINCT c.CourtID
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE'
              AND c.ClassID != ?
              AND sch.ScheduleType = 'WEEKLY'
              AND csd.Weekday IN (?)
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [excludeId, weekdays, startTime, endTime]);
        rows1.forEach(r => conflicting.add(r.CourtID));

        // 2. WEEKLY new class vs existing ONE_TIME active classes on a matching weekday
        //    (MySQL DAYOFWEEK: 1=Sun…7=Sat, so subtract 1 to get 0=Sun…6=Sat)
        const [rows2] = await conn.query(`
            SELECT DISTINCT c.CourtID
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            WHERE c.Status = 'ACTIVE'
              AND c.ClassID != ?
              AND sch.ScheduleType = 'ONE_TIME'
              AND (DAYOFWEEK(sch.OneTimeDate) - 1) IN (?)
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [excludeId, weekdays, startTime, endTime]);
        rows2.forEach(r => conflicting.add(r.CourtID));

    } else if (scheduleType === 'ONE_TIME') {
        if (!oneTimeDate) return conflicting;

        // Derive the weekday of the one-time date (0=Sun…6=Sat)
        const [y, mo, d] = oneTimeDate.split('-').map(Number);
        const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();

        // 1. ONE_TIME new class vs existing ONE_TIME active classes on the same date
        const [rows1] = await conn.query(`
            SELECT DISTINCT c.CourtID
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            WHERE c.Status = 'ACTIVE'
              AND c.ClassID != ?
              AND sch.ScheduleType = 'ONE_TIME'
              AND DATE(sch.OneTimeDate) = ?
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [excludeId, oneTimeDate, startTime, endTime]);
        rows1.forEach(r => conflicting.add(r.CourtID));

        // 2. ONE_TIME new class vs existing WEEKLY active classes on the same weekday
        const [rows2] = await conn.query(`
            SELECT DISTINCT c.CourtID
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE'
              AND c.ClassID != ?
              AND sch.ScheduleType = 'WEEKLY'
              AND csd.Weekday = ?
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [excludeId, weekday, startTime, endTime]);
        rows2.forEach(r => conflicting.add(r.CourtID));
    }

    return conflicting;
}

/**
 * Identical schedule-aware logic as getConflictingCourtIds, but returns a
 * Set<CoachID> of coaches that are already teaching during the given slot.
 * Only ACTIVE classes are considered.
 */
async function getConflictingCoachIds(conn, { scheduleType, weekdays, oneTimeDate, startTime, endTime, excludeClassId }) {
    const conflicting = new Set();
    const excludeId = excludeClassId || 0;

    if (scheduleType === 'WEEKLY') {
        if (!weekdays || weekdays.length === 0) return conflicting;

        // WEEKLY new class vs existing WEEKLY active classes — shared weekday + time overlap
        const [rows1] = await conn.query(`
            SELECT DISTINCT c.CoachID
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE'
              AND c.ClassID != ?
              AND sch.ScheduleType = 'WEEKLY'
              AND csd.Weekday IN (?)
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [excludeId, weekdays, startTime, endTime]);
        rows1.forEach(r => conflicting.add(r.CoachID));

        // WEEKLY new class vs existing ONE_TIME active classes on a matching weekday
        const [rows2] = await conn.query(`
            SELECT DISTINCT c.CoachID
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            WHERE c.Status = 'ACTIVE'
              AND c.ClassID != ?
              AND sch.ScheduleType = 'ONE_TIME'
              AND (DAYOFWEEK(sch.OneTimeDate) - 1) IN (?)
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [excludeId, weekdays, startTime, endTime]);
        rows2.forEach(r => conflicting.add(r.CoachID));

    } else if (scheduleType === 'ONE_TIME') {
        if (!oneTimeDate) return conflicting;

        const [y, mo, d] = oneTimeDate.split('-').map(Number);
        const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();

        // ONE_TIME new class vs existing ONE_TIME active classes on the same date
        const [rows1] = await conn.query(`
            SELECT DISTINCT c.CoachID
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            WHERE c.Status = 'ACTIVE'
              AND c.ClassID != ?
              AND sch.ScheduleType = 'ONE_TIME'
              AND DATE(sch.OneTimeDate) = ?
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [excludeId, oneTimeDate, startTime, endTime]);
        rows1.forEach(r => conflicting.add(r.CoachID));

        // ONE_TIME new class vs existing WEEKLY active classes on the same weekday
        const [rows2] = await conn.query(`
            SELECT DISTINCT c.CoachID
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE'
              AND c.ClassID != ?
              AND sch.ScheduleType = 'WEEKLY'
              AND csd.Weekday = ?
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [excludeId, weekday, startTime, endTime]);
        rows2.forEach(r => conflicting.add(r.CoachID));
    }

    return conflicting;
}

exports.getAvailableCourts = async (req, res, next) => {
    try {
        const { sportId, scheduleType, startTime, endTime, weekdays, oneTimeDate, startDate } = req.query;

        if (!sportId || !scheduleType || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        let simulatedSessions = [];
        if (scheduleType === "ONE_TIME") {
            if (!oneTimeDate) return res.status(400).json({ message: "oneTimeDate is required for ONE_TIME" });
            simulatedSessions.push({ date: oneTimeDate, startTime, endTime });
        } else if (scheduleType === "WEEKLY") {
            if (!startDate || !weekdays) return res.status(400).json({ message: "startDate and weekdays are required for WEEKLY" });
            let parsedWeekdays;
            try {
                parsedWeekdays = JSON.parse(weekdays);
                if (!Array.isArray(parsedWeekdays)) throw new Error("Weekdays must be an array");
            } catch (e) {
                // If it's already an array (e.g., from qs parsing like weekdays[]=1)
                if (Array.isArray(weekdays)) {
                    parsedWeekdays = weekdays.map(Number);
                } else {
                    return res.status(400).json({ message: "weekdays must be a valid JSON array or query array" });
                }
            }
            const dates = getWeeklySessionDates(startDate, parsedWeekdays, 4);
            simulatedSessions = dates.map(d => ({ date: d, startTime, endTime }));
        } else {
            return res.status(400).json({ message: "Invalid scheduleType" });
        }

        // 1. Filter courts by court_sport
        const [courts] = await pool.query(
            `SELECT c.CourtID, c.CourtName, c.Capacity, c.PricePerHour 
             FROM court c
             JOIN court_sport cs ON c.CourtID = cs.CourtID
             WHERE cs.SportID = ? AND c.Status = 'AVAILABLE'`,
            [sportId]
        );

        if (courts.length === 0) {
            return res.json({ availableCourts: [] }); // No courts support this sport
        }

        // Filter out courts with scheduling conflicts
        const conflictingCourtIds = await getConflictingCourtIds(pool, {
            scheduleType,
            weekdays: parsedWeekdays || [],
            oneTimeDate: oneTimeDate || null,
            startTime,
            endTime
        });

        const safeCourts = courts.filter(c => !conflictingCourtIds.has(c.CourtID));

        res.json({ availableCourts: safeCourts });

    } catch (err) {
        next(err);
    }
};

exports.getCoaches = async (req, res, next) => {
    try {
        const [coaches] = await pool.query(`
            SELECT c.CoachID as id, u.FirstName as firstName, u.LastName as lastName,
                   GROUP_CONCAT(DISTINCT s.SportName ORDER BY s.SportName SEPARATOR ',') AS sports
            FROM coach c
            JOIN useraccount u ON c.UserID = u.UserID
            LEFT JOIN coachsport cs ON c.CoachID = cs.CoachID
            LEFT JOIN sport s ON cs.SportID = s.SportID
            WHERE u.IsActive = 1
            GROUP BY c.CoachID, c.UserID, u.FirstName, u.LastName
        `);
        // Map to format suitable for frontend
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

exports.getClasses = async (req, res, next) => {
    try {
        const [classes] = await pool.query(`
            SELECT 
                c.ClassID as id,
                s.SportName as sport,
                c.Title as className,
                c.CoachID as coachId,
                CONCAT(u.FirstName, ' ', u.LastName) as coachName,
                c.CourtID as courtId,
                ct.CourtName as courtName,
                sch.ScheduleType as scheduleType,
                sch.OneTimeDate as oneTimeDate,
                DATE_FORMAT(sch.StartTime, '%H:%i') as startTime,
                DATE_FORMAT(sch.EndTime, '%H:%i') as endTime,
                c.Capacity as capacity,
                c.Fee as fee,
                c.CreatedAt as createdAt,
                c.StartDate as startDate,
                c.Status as status,
                GROUP_CONCAT(cd.Weekday) as days
            FROM class c
            JOIN sport s ON c.SportID = s.SportID
            JOIN coach co ON c.CoachID = co.CoachID
            JOIN useraccount u ON co.UserID = u.UserID
            JOIN court ct ON c.CourtID = ct.CourtID
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            LEFT JOIN classscheduleday cd ON sch.ScheduleID = cd.ScheduleID
            GROUP BY c.ClassID, sch.ScheduleID
            ORDER BY c.CreatedAt DESC
        `);

        // Map Weekday ints to Strings
        const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const mapped = classes.map(c => ({
            ...c,
            // If it's weekly, days is a string "1,3", split it and map to names
            days: c.scheduleType === 'WEEKLY' && c.days
                ? c.days.split(',').map(d => dayMap[Number(d)])
                : []
        }));

        res.json({ classes: mapped });
    } catch (err) {
        next(err);
    }
};

exports.createClass = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const {
            title, sportId, coachId, courtId, capacity, fee,
            billingType, scheduleType,
            startDate, oneTimeDate, startTime, endTime,
            weekdays
        } = req.body;

        if (!title || !sportId || !coachId || !courtId || !capacity || fee === undefined || !billingType || !scheduleType || !startDate || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (capacity <= 0 || fee < 0) {
            return res.status(400).json({ message: "Capacity must be > 0 and fee must be >= 0" });
        }

        if (scheduleType === "WEEKLY" && billingType !== "MONTHLY") {
            return res.status(400).json({ message: "WEEKLY schedule must have MONTHLY billing type" });
        }
        if (scheduleType === "ONE_TIME" && billingType !== "ONE_TIME") {
            return res.status(400).json({ message: "ONE_TIME schedule must have ONE_TIME billing type" });
        }

        if (scheduleType === "WEEKLY" && (!Array.isArray(weekdays) || weekdays.length === 0)) {
            return res.status(400).json({ message: "Weekdays are required for WEEKLY schedule" });
        }
        if (scheduleType === "ONE_TIME" && !oneTimeDate) {
            return res.status(400).json({ message: "OneTimeDate is required for ONE_TIME schedule" });
        }

        // Duplicate Check: Same Title, Coach, Court, and Start Date
        const checkStartDate = scheduleType === "WEEKLY" ? startDate : oneTimeDate;
        const [existingClass] = await conn.query(
            "SELECT 1 FROM class WHERE Title = ? AND CoachID = ? AND CourtID = ? AND StartDate = ? LIMIT 1",
            [title, coachId, courtId, checkStartDate]
        );
        if (existingClass.length > 0) {
            conn.release();
            return res.status(400).json({ message: "This class already exists" });
        }

        // Hard conflict checks before starting the transaction
        const conflictOpts = {
            scheduleType,
            weekdays: Array.isArray(weekdays) ? weekdays : [],
            oneTimeDate: oneTimeDate || null,
            startTime,
            endTime
        };

        const conflictingCourtIds = await getConflictingCourtIds(conn, conflictOpts);
        if (conflictingCourtIds.has(Number(courtId))) {
            conn.release();
            return res.status(409).json({ message: "Scheduling Conflict: This court is already booked during this time." });
        }

        const conflictingCoachIds = await getConflictingCoachIds(conn, conflictOpts);
        if (conflictingCoachIds.has(Number(coachId))) {
            conn.release();
            return res.status(409).json({ message: "Scheduling Conflict: This coach is already teaching another class during this time." });
        }

        await conn.beginTransaction();

        // Check if court supports sport
        const [courtSport] = await conn.query(
            "SELECT 1 FROM court_sport WHERE CourtID = ? AND SportID = ?",
            [courtId, sportId]
        );
        if (courtSport.length === 0) {
            await conn.rollback();
            return res.status(400).json({ message: "The selected court does not support this sport" });
        }

        // Insert Class
        const [classResult] = await conn.query(
            `INSERT INTO class (SportID, CoachID, CourtID, Title, StartDate, Capacity, Fee, Status, BillingType)
             VALUES(?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
            [sportId, coachId, courtId, title, checkStartDate, capacity, fee, billingType]
        );
        const classId = classResult.insertId;

        // Insert Schedule
        const [scheduleResult] = await conn.query(
            `INSERT INTO classschedule(ClassID, ScheduleType, OneTimeDate, StartTime, EndTime)
             VALUES(?, ?, ?, ?, ?)`,
            [classId, scheduleType, scheduleType === 'ONE_TIME' ? oneTimeDate : null, startTime, endTime]
        );
        const scheduleId = scheduleResult.insertId;

        // Insert Weekdays if WEEKLY
        if (scheduleType === "WEEKLY") {
            const weekdayVals = weekdays.map(day => [scheduleId, day]);
            await conn.query(
                `INSERT INTO classscheduleday(ScheduleID, Weekday) VALUES ? `,
                [weekdayVals]
            );
        }

        // Generate Sessions
        const sessionVals = [];
        for (const sim of simulatedSessions) {
            sessionVals.push([classId, sim.date, sim.startTime, sim.endTime, 'SCHEDULED']);
        }

        if (sessionVals.length > 0) {
            await conn.query(
                `INSERT INTO classsession(ClassID, SessionDate, StartTime, EndTime, Status) VALUES ? `,
                [sessionVals]
            );
        }

        await conn.commit();
        res.status(201).json({ message: "Class created successfully", classId, scheduleId });

    } catch (err) {
        try { await conn.rollback(); } catch (e) { }
        next(err);
    } finally {
        conn.release();
    }
};

exports.deactivateClass = async (req, res, next) => {
    try {
        const classId = req.params.classId;
        const [result] = await pool.query(
            "UPDATE class SET Status = 'DEACTIVATED' WHERE ClassID = ?",
            [classId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Class not found" });
        }

        res.json({ message: "Class deactivated successfully" });
    } catch (err) {
        next(err);
    }
};

exports.activateClass = async (req, res, next) => {
    try {
        const classId = req.params.classId;
        const [result] = await pool.query(
            "UPDATE class SET Status = 'ACTIVE' WHERE ClassID = ?",
            [classId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Class not found" });
        }

        res.json({ message: "Class activated successfully" });
    } catch (err) {
        next(err);
    }
};
