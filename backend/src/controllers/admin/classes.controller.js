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

function checkTimeConflict(start1, end1, start2, end2) {
    // start1 < end2 AND end1 > start2
    return start1 < end2 && end1 > start2;
}

async function getConflictingCourts(conn, simulatedSessions) {
    // simulatedSessions is an array of { date, startTime, endTime }
    if (simulatedSessions.length === 0) return new Set();

    const dates = [...new Set(simulatedSessions.map(s => s.date))];
    if (dates.length === 0) return new Set();

    // Fetch existing active sessions to check for conflicts
    const q = `
        SELECT c.CourtID, cs.SessionDate, cs.StartTime, cs.EndTime
        FROM classsession cs
        JOIN class c ON cs.ClassID = c.ClassID
        WHERE cs.Status != 'CANCELLED'
          AND c.Status != 'CANCELLED'
          AND cs.SessionDate IN (?)
    `;

    const [existingSessions] = await conn.query(q, [dates]);
    const conflictingCourtIds = new Set();

    for (const sim of simulatedSessions) {
        for (const existing of existingSessions) {
            // Existing date from DB might be a Date object, so format it to YYYY-MM-DD for comparison
            const existingDateStr = new Date(existing.SessionDate).toISOString().split('T')[0];
            if (sim.date === existingDateStr) {
                if (checkTimeConflict(sim.startTime, sim.endTime, existing.StartTime, existing.EndTime)) {
                    conflictingCourtIds.add(existing.CourtID);
                }
            }
        }
    }

    return conflictingCourtIds;
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

        // 2 & 3 & 4: Find conflicts and remove invalid courts
        const conn = await pool.getConnection();
        let conflictingCourtIds;
        try {
            conflictingCourtIds = await getConflictingCourts(conn, simulatedSessions);
        } finally {
            conn.release();
        }

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

        // Check conflicts before starting transaction
        let simulatedSessions = [];
        if (scheduleType === "ONE_TIME") {
            simulatedSessions.push({ date: oneTimeDate, startTime, endTime });
        } else if (scheduleType === "WEEKLY") {
            const dates = getWeeklySessionDates(startDate, weekdays, 4);
            simulatedSessions = dates.map(d => ({ date: d, startTime, endTime }));
        }

        const conflictingCourtIds = await getConflictingCourts(conn, simulatedSessions);
        if (conflictingCourtIds.has(Number(courtId))) {
            conn.release();
            return res.status(409).json({ message: "The selected court is already booked for ONE or MORE of the requested time slots." });
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
             VALUES(?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)`,
            [sportId, coachId, courtId, title, startDate, capacity, fee, billingType]
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
