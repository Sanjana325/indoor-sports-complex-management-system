const { pool } = require("../config/db");

// calculate all dates for a weekly class schedule over a given number of weeks
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

// check if selected courts are already occupied by other classes, bookings, or blocks
async function checkCourtConflicts(conn, { scheduleType, weekdays, oneTimeDate, startTime, endTime, excludeClassId, startDate }) {
    const conflicting = new Set();
    const excludeId = excludeClassId || 0;

    if (scheduleType === 'WEEKLY') {
        if (!weekdays || weekdays.length === 0) return conflicting;
        const sDate = startDate || (new Date()).toISOString().split('T')[0];
        const weekdayStr = Array.isArray(weekdays) ? weekdays.join(',') : weekdays;

        // verify against other active weekly classes
        const [rows1] = await conn.query(`
            SELECT DISTINCT cc.CourtID FROM class c
            JOIN class_court cc ON c.ClassID = cc.ClassID
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE' AND c.ClassID != ? AND sch.ScheduleType = 'WEEKLY'
              AND FIND_IN_SET(csd.Weekday, ?) AND TIME(?) < sch.EndTime AND TIME(?) > sch.StartTime
        `, [excludeId, weekdayStr, startTime, endTime]);
        rows1.forEach(r => conflicting.add(r.CourtID));

        // check for one-time classes on specific dates
        const [rows2] = await conn.query(`
            SELECT DISTINCT cc.CourtID FROM class c
            JOIN class_court cc ON c.ClassID = cc.ClassID
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            WHERE c.Status = 'ACTIVE' AND c.ClassID != ? AND sch.ScheduleType = 'ONE_TIME'
              AND sch.OneTimeDate >= ? AND FIND_IN_SET(DAYOFWEEK(sch.OneTimeDate) - 1, ?)
              AND TIME(?) < sch.EndTime AND TIME(?) > sch.StartTime
        `, [excludeId, sDate, weekdayStr, startTime, endTime]);
        rows2.forEach(r => conflicting.add(r.CourtID));

    } else if (scheduleType === 'ONE_TIME') {
        if (!oneTimeDate) return conflicting;
        const [y, mo, d] = oneTimeDate.split('-').map(Number);
        const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();

        const [rows1] = await conn.query(`
            SELECT DISTINCT cc.CourtID FROM class c
            JOIN class_court cc ON c.ClassID = cc.ClassID
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            WHERE c.Status = 'ACTIVE' AND c.ClassID != ? AND sch.ScheduleType = 'ONE_TIME'
              AND DATE(sch.OneTimeDate) = ? AND TIME(?) < sch.EndTime AND TIME(?) > sch.StartTime
        `, [excludeId, oneTimeDate, startTime, endTime]);
        rows1.forEach(r => conflicting.add(r.CourtID));

        const [rows2] = await conn.query(`
            SELECT DISTINCT cc.CourtID FROM class c
            JOIN class_court cc ON c.ClassID = cc.ClassID
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE' AND c.ClassID != ? AND sch.ScheduleType = 'WEEKLY'
              AND c.StartDate <= ? AND csd.Weekday = ? AND TIME(?) < sch.EndTime AND TIME(?) > sch.StartTime
        `, [excludeId, oneTimeDate, weekday, startTime, endTime]);
        rows2.forEach(r => conflicting.add(r.CourtID));
    }

    // check against maintenance blocks
    if (scheduleType === 'ONE_TIME') {
        const startDT = `${oneTimeDate} ${startTime}`;
        const endDT = `${oneTimeDate} ${endTime}`;
        const [blockedRows] = await conn.query(`
            SELECT DISTINCT CourtID FROM blockedslot WHERE (StartDateTime < ? AND EndDateTime > ?)
        `, [endDT, startDT]);
        blockedRows.forEach(r => conflicting.add(r.CourtID));
    } else if (scheduleType === 'WEEKLY') {
        const weekdayStr = Array.isArray(weekdays) ? weekdays.join(',') : weekdays;
        const [blockedRows] = await conn.query(`
            SELECT DISTINCT CourtID FROM blockedslot
            WHERE FIND_IN_SET(DAYOFWEEK(StartDateTime) - 1, ?) AND DATE(StartDateTime) >= ?
              AND TIME(StartDateTime) < TIME(?) AND TIME(EndDateTime) > TIME(?)
        `, [weekdayStr, startDate || (new Date()).toISOString().split('T')[0], endTime, startTime]);
        blockedRows.forEach(r => conflicting.add(r.CourtID));

        // check against private court bookings
        const [bookingRows] = await conn.query(`
            SELECT DISTINCT CourtID FROM booking
            WHERE Status IN ('CONFIRMED', 'WAITING_VERIFICATION')
              AND FIND_IN_SET(DAYOFWEEK(StartDateTime) - 1, ?) AND DATE(StartDateTime) >= ?
              AND TIME(StartDateTime) < TIME(?) AND TIME(EndDateTime) > TIME(?)
        `, [weekdayStr, startDate || (new Date()).toISOString().split('T')[0], endTime, startTime]);
        bookingRows.forEach(r => conflicting.add(r.CourtID));
    }

    return conflicting;
}

// check if the coach is already teaching another class during the selected time
async function checkCoachConflicts(conn, { scheduleType, weekdays, oneTimeDate, startTime, endTime, excludeClassId, startDate }) {
    const conflicting = new Set();
    const excludeId = excludeClassId || 0;

    if (scheduleType === 'WEEKLY') {
        if (!weekdays || weekdays.length === 0) return conflicting;
        const sDate = startDate || (new Date()).toISOString().split('T')[0];

        const [rows1] = await conn.query(`
            SELECT DISTINCT c.CoachID FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE' AND c.ClassID != ? AND sch.ScheduleType = 'WEEKLY'
              AND csd.Weekday IN (?) AND TIME(?) < sch.EndTime AND TIME(?) > sch.StartTime
        `, [excludeId, weekdays, startTime, endTime]);
        rows1.forEach(r => conflicting.add(r.CoachID));

        const [rows2] = await conn.query(`
            SELECT DISTINCT c.CoachID FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            WHERE c.Status = 'ACTIVE' AND c.ClassID != ? AND sch.ScheduleType = 'ONE_TIME'
              AND sch.OneTimeDate >= ? AND (DAYOFWEEK(sch.OneTimeDate) - 1) IN (?)
              AND TIME(?) < sch.EndTime AND TIME(?) > sch.StartTime
        `, [excludeId, sDate, weekdays, startTime, endTime]);
        rows2.forEach(r => conflicting.add(r.CoachID));

    } else if (scheduleType === 'ONE_TIME') {
        if (!oneTimeDate) return conflicting;
        const [y, mo, d] = oneTimeDate.split('-').map(Number);
        const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();

        const [rows1] = await conn.query(`
            SELECT DISTINCT c.CoachID FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            WHERE c.Status = 'ACTIVE' AND c.ClassID != ? AND sch.ScheduleType = 'ONE_TIME'
              AND DATE(sch.OneTimeDate) = ? AND TIME(?) < sch.EndTime AND TIME(?) > sch.StartTime
        `, [excludeId, oneTimeDate, startTime, endTime]);
        rows1.forEach(r => conflicting.add(r.CoachID));

        const [rows2] = await conn.query(`
            SELECT DISTINCT c.CoachID FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE' AND c.ClassID != ? AND sch.ScheduleType = 'WEEKLY'
              AND c.StartDate <= ? AND csd.Weekday = ? AND TIME(?) < sch.EndTime AND TIME(?) > sch.StartTime
        `, [excludeId, oneTimeDate, weekday, startTime, endTime]);
        rows2.forEach(r => conflicting.add(r.CoachID));
    }

    return conflicting;
}

// setup a new class with its schedule, courts, and initial sessions
async function createClass(data, conn = pool) {
    const {
        title, sportId, coachId, courtIds, capacity, fee,
        billingType, scheduleType, startDate, oneTimeDate, startTime, endTime, weekdays
    } = data;

    const [classResult] = await conn.query(
        `INSERT INTO class (SportID, CoachID, Title, StartDate, Capacity, Fee, Status, BillingType) VALUES(?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
        [sportId, coachId, title, scheduleType === "WEEKLY" ? startDate : oneTimeDate, capacity, fee, billingType]
    );
    const classId = classResult.insertId;

    const classCourtVals = courtIds.map(cid => [classId, cid]);
    await conn.query("INSERT INTO class_court (ClassID, CourtID) VALUES ?", [classCourtVals]);

    const [scheduleResult] = await conn.query(
        `INSERT INTO classschedule(ClassID, ScheduleType, OneTimeDate, StartTime, EndTime) VALUES(?, ?, ?, ?, ?)`,
        [classId, scheduleType, scheduleType === 'ONE_TIME' ? oneTimeDate : null, startTime, endTime]
    );
    const scheduleId = scheduleResult.insertId;

    if (scheduleType === "WEEKLY") {
        const weekdayVals = weekdays.map(day => [scheduleId, day]);
        await conn.query(`INSERT INTO classscheduleday(ScheduleID, Weekday) VALUES ? `, [weekdayVals]);
    }

    // generate the first 4 weeks of sessions for a weekly class
    let simulatedSessions = [];
    if (scheduleType === 'WEEKLY') {
        const dates = getWeeklySessionDates(startDate, weekdays, 4);
        simulatedSessions = dates.map(d => ({ date: d, startTime, endTime }));
    } else {
        simulatedSessions = [{ date: oneTimeDate, startTime, endTime }];
    }

    const sessionVals = simulatedSessions.map(sim => [classId, sim.date, sim.startTime, sim.endTime, 'SCHEDULED']);
    if (sessionVals.length > 0) {
        await conn.query(`INSERT INTO classsession(ClassID, SessionDate, StartTime, EndTime, Status) VALUES ? `, [sessionVals]);
    }

    return { classId, scheduleId };
}

// modify class details and update sessions if the schedule has changed
async function updateClass(classId, data, conn = pool) {
    const {
        title, sportId, coachId, courtIds, capacity, fee,
        billingType, scheduleType, startDate, oneTimeDate, startTime, endTime, weekdays,
        scheduleChanged
    } = data;

    const checkStartDate = scheduleType === "WEEKLY" ? startDate : oneTimeDate;
    await conn.query(
        `UPDATE class SET SportID = ?, CoachID = ?, Title = ?, StartDate = ?, Capacity = ?, Fee = ?, BillingType = ? WHERE ClassID = ?`,
        [sportId, coachId, title, checkStartDate, capacity, fee, billingType, classId]
    );

    await conn.query("DELETE FROM class_court WHERE ClassID = ?", [classId]);
    await conn.query("INSERT INTO class_court (ClassID, CourtID) VALUES ?", [courtIds.map(cid => [classId, cid])]);

    const [existingSch] = await conn.query("SELECT ScheduleID FROM classschedule WHERE ClassID = ?", [classId]);
    const scheduleId = existingSch[0].ScheduleID;
    await conn.query(
        `UPDATE classschedule SET ScheduleType = ?, OneTimeDate = ?, StartTime = ?, EndTime = ? WHERE ScheduleID = ?`,
        [scheduleType, scheduleType === 'ONE_TIME' ? oneTimeDate : null, startTime, endTime, scheduleId]
    );

    await conn.query("DELETE FROM classscheduleday WHERE ScheduleID = ?", [scheduleId]);
    if (scheduleType === "WEEKLY") {
        await conn.query(`INSERT INTO classscheduleday(ScheduleID, Weekday) VALUES ? `, [weekdays.map(day => [scheduleId, day])]);
    }

    // re-generate future scheduled sessions if class time changed
    if (scheduleChanged) {
        await conn.query(`DELETE FROM classsession WHERE ClassID = ? AND Status = 'SCHEDULED' AND SessionDate >= CURDATE()`, [classId]);
        let simulatedSessions = [];
        if (scheduleType === 'WEEKLY') {
            const dates = getWeeklySessionDates(startDate, weekdays, 4);
            simulatedSessions = dates.map(d => ({ date: d, startTime, endTime }));
        } else {
            simulatedSessions = [{ date: oneTimeDate, startTime, endTime }];
        }
        const sessionVals = simulatedSessions.map(sim => [classId, sim.date, sim.startTime, sim.endTime, 'SCHEDULED']);
        if (sessionVals.length > 0) {
            await conn.query(`INSERT IGNORE INTO classsession(ClassID, SessionDate, StartTime, EndTime, Status) VALUES ? `, [sessionVals]);
        }
    }
}

// get a detailed list of all classes for administrative management
async function listAllClasses() {
    const [rows] = await pool.query(`
        SELECT c.ClassID as id, s.SportName as sport, c.Title as className, c.CoachID as coachId,
               CONCAT(u.FirstName, ' ', u.LastName) as coachName, sch.ScheduleType as scheduleType,
               sch.OneTimeDate as oneTimeDate, DATE_FORMAT(sch.StartTime, '%H:%i') as startTime,
               DATE_FORMAT(sch.EndTime, '%H:%i') as endTime, c.Capacity as capacity, c.Fee as fee,
               c.CreatedAt as createdAt, c.StartDate as startDate, c.Status as status,
               GROUP_CONCAT(DISTINCT cd.Weekday) as days,
               GROUP_CONCAT(DISTINCT ct.CourtName ORDER BY ct.CourtName SEPARATOR ', ') as courtNames,
               GROUP_CONCAT(DISTINCT ct.CourtID) as courtIds,
               (SELECT COUNT(*) FROM enrollment e WHERE e.ClassID = c.ClassID AND e.Status = 'ENROLLED') AS enrolledCount
        FROM class c
        JOIN sport s ON c.SportID = s.SportID
        JOIN coach co ON c.CoachID = co.CoachID
        JOIN useraccount u ON co.UserID = u.UserID
        LEFT JOIN class_court cc ON c.ClassID = cc.ClassID
        LEFT JOIN court ct ON cc.CourtID = ct.CourtID
        JOIN classschedule sch ON c.ClassID = sch.ClassID
        LEFT JOIN classscheduleday cd ON sch.ScheduleID = cd.ScheduleID
        GROUP BY c.ClassID, sch.ScheduleType, sch.OneTimeDate, sch.StartTime, sch.EndTime, sch.ScheduleID
        ORDER BY c.CreatedAt DESC
    `);
    return rows;
}

// get all class sessions for the complex-wide calendar view
async function listSessionsForCalendar() {
    const [rows] = await pool.query(`
        SELECT cs.SessionID as id, c.ClassID, c.Title as title, cs.SessionDate as date,
               DATE_FORMAT(cs.StartTime, '%H:%i') as startTime, DATE_FORMAT(cs.EndTime, '%H:%i') as endTime,
               cs.Status as status, s.SportName as sportName, s.ColorCode as color,
               u.FirstName as coachFirst, u.LastName as coachLast, u.PhoneNumber as coachPhone,
               (SELECT GROUP_CONCAT(ct.CourtName SEPARATOR ', ') FROM class_court cc 
                JOIN court ct ON cc.CourtID = ct.CourtID WHERE cc.ClassID = c.ClassID) as courts
        FROM classsession cs
        JOIN class c ON cs.ClassID = c.ClassID
        JOIN sport s ON c.SportID = s.SportID
        JOIN coach co ON c.CoachID = co.CoachID
        JOIN useraccount u ON co.UserID = u.UserID
        ORDER BY cs.SessionDate ASC, cs.StartTime ASC
    `);
    return rows;
}

// get active classes that a player can enroll in
async function listAvailableForPlayer(userId) {
    const [rows] = await pool.query(`
        SELECT c.ClassID, c.Title, c.StartDate, c.Capacity, c.Fee, c.BillingType, s.SportName,
               co.CoachID, ua.FirstName AS CoachFirstName, ua.LastName AS CoachLastName,
               GROUP_CONCAT(DISTINCT crt.CourtName) AS CourtNames,
               MAX(sch.StartTime) AS StartTime, MAX(sch.EndTime) AS EndTime, MAX(sch.ScheduleType) AS ScheduleType,
               GROUP_CONCAT(DISTINCT csd.Weekday) AS Weekdays,
               GROUP_CONCAT(DISTINCT q.QualificationName) AS CoachQualifications,
               (SELECT COUNT(*) FROM enrollment e WHERE e.ClassID = c.ClassID AND e.Status = 'ENROLLED') AS EnrolledCount
        FROM class c
        JOIN sport s ON c.SportID = s.SportID
        JOIN coach co ON c.CoachID = co.CoachID
        JOIN useraccount ua ON co.UserID = ua.UserID
        LEFT JOIN class_court cc ON c.ClassID = cc.ClassID
        LEFT JOIN court crt ON cc.CourtID = crt.CourtID
        LEFT JOIN classschedule sch ON c.ClassID = sch.ClassID
        LEFT JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
        LEFT JOIN coachqualification cq ON co.CoachID = cq.CoachID
        LEFT JOIN qualification q ON cq.QualificationID = q.QualificationID
        WHERE c.Status = 'ACTIVE'
          AND c.ClassID NOT IN (SELECT ClassID FROM enrollment WHERE UserID = ? AND Status IN ('ENROLLED', 'PENDING'))
        GROUP BY c.ClassID, c.Title, c.StartDate, c.Capacity, c.Fee, c.BillingType, s.SportName, co.CoachID, ua.FirstName, ua.LastName
        ORDER BY c.StartDate ASC
    `, [userId]);
    return rows;
}

// get classes a player is currently attending
async function listEnrolledForPlayer(userId) {
    const [rows] = await pool.query(`
        SELECT e.EnrollmentID, e.EnrolledAt, e.Status AS EnrollmentStatus,
               c.ClassID, c.Title, c.Fee, c.BillingType, c.Status AS ClassStatus,
               s.SportName, ua.FirstName AS CoachFirstName, ua.LastName AS CoachLastName,
               GROUP_CONCAT(DISTINCT crt.CourtName) AS CourtNames,
               MAX(sch.StartTime) AS StartTime, MAX(sch.EndTime) AS EndTime, MAX(sch.ScheduleType) AS ScheduleType,
               GROUP_CONCAT(DISTINCT csd.Weekday) AS Weekdays, em.Status AS PaymentStatus, 
               em.PeriodMonth, em.EnrollmentMonthID, GROUP_CONCAT(DISTINCT q.QualificationName) AS CoachQualifications
        FROM enrollment e
        JOIN class c ON e.ClassID = c.ClassID
        LEFT JOIN sport s ON c.SportID = s.SportID
        LEFT JOIN coach co ON c.CoachID = co.CoachID
        LEFT JOIN useraccount ua ON co.UserID = ua.UserID
        LEFT JOIN class_court cc ON c.ClassID = cc.ClassID
        LEFT JOIN court crt ON cc.CourtID = crt.CourtID
        LEFT JOIN classschedule sch ON c.ClassID = sch.ClassID
        LEFT JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
        LEFT JOIN coachqualification cq ON co.CoachID = cq.CoachID
        LEFT JOIN qualification q ON cq.QualificationID = q.QualificationID
        LEFT JOIN (
            SELECT EnrollmentID, Status, PeriodMonth, EnrollmentMonthID FROM enrollmentmonth em1
            WHERE em1.EnrollmentMonthID = (SELECT MAX(EnrollmentMonthID) FROM enrollmentmonth em2 WHERE em2.EnrollmentID = em1.EnrollmentID)
        ) em ON e.EnrollmentID = em.EnrollmentID
        WHERE e.UserID = ? AND e.Status != 'CANCELLED'
        GROUP BY e.EnrollmentID, e.EnrolledAt, e.Status, c.ClassID, c.Title, c.Fee, c.BillingType, c.Status, s.SportName, ua.FirstName, ua.LastName, em.Status, em.PeriodMonth, em.EnrollmentMonthID
        ORDER BY e.EnrolledAt DESC
    `, [userId]);
    return rows;
}

// enable or disable a class
async function updateStatus(classId, status) {
    const [result] = await pool.query("UPDATE class SET Status = ? WHERE ClassID = ?", [status, classId]);
    return result.affectedRows > 0;
}

// find details of a specific class including schedule
async function findById(classId, conn = pool) {
    const [rows] = await conn.query(`
        SELECT c.*, sch.ScheduleID, sch.ScheduleType, sch.OneTimeDate, sch.StartTime, sch.EndTime,
               GROUP_CONCAT(DISTINCT csd.Weekday) as weekdays
        FROM class c
        JOIN classschedule sch ON c.ClassID = sch.ClassID
        LEFT JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
        WHERE c.ClassID = ?
        GROUP BY c.ClassID, sch.ScheduleID
    `, [classId]);
    return rows.length ? rows[0] : null;
}

// get list of all classes for a specific coach
async function listByCoachId(coachId) {
    const [rows] = await pool.query(`
        SELECT c.ClassID as id, s.SportName as sport, c.Title as className, c.CoachID as coachId,
               CONCAT(u.FirstName, ' ', u.LastName) as coachName, sch.ScheduleType as scheduleType,
               sch.OneTimeDate as oneTimeDate, DATE_FORMAT(sch.StartTime, '%H:%i') as startTime,
               DATE_FORMAT(sch.EndTime, '%H:%i') as endTime, c.Capacity as capacity, c.Fee as fee,
               c.CreatedAt as createdAt, c.StartDate as startDate, c.Status as status,
               GROUP_CONCAT(DISTINCT cd.Weekday) as days,
               GROUP_CONCAT(DISTINCT ct.CourtName ORDER BY ct.CourtName SEPARATOR ', ') as courtNames,
               GROUP_CONCAT(DISTINCT ct.CourtID) as courtIds,
               (SELECT COUNT(*) FROM enrollment e WHERE e.ClassID = c.ClassID AND e.Status = 'ENROLLED') AS enrolledCount
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
    return rows;
}

// get upcoming sessions for a specific coach's dashboard
async function findSessionsByCoach(coachId, filters = {}) {
    let sql = `
        SELECT cs.SessionID as id, cs.ClassID as classId, c.Title as className,
               s.SportName as sport, s.ColorCode as sportColor,
               DATE_FORMAT(cs.SessionDate, '%Y-%m-%d') as date,
               DATE_FORMAT(cs.StartTime, '%H:%i') as startTime,
               DATE_FORMAT(cs.EndTime, '%H:%i') as endTime,
               GROUP_CONCAT(DISTINCT ct.CourtName SEPARATOR ', ') as court, cs.Status as status,
               u.FirstName as coachFirst, u.LastName as coachLast, u.PhoneNumber as coachPhone
        FROM classsession cs
        JOIN class c ON cs.ClassID = c.ClassID
        JOIN sport s ON c.SportID = s.SportID
        JOIN coach co ON c.CoachID = co.CoachID
        JOIN useraccount u ON co.UserID = u.UserID
        LEFT JOIN class_court cc ON c.ClassID = cc.ClassID
        LEFT JOIN court ct ON cc.CourtID = ct.CourtID
        WHERE c.CoachID = ?`;
    
    const params = [coachId];

    if (filters.date) {
        sql += " AND cs.SessionDate = ?";
        params.push(filters.date);
    }
    if (filters.status) {
        sql += " AND cs.Status = ?";
        params.push(filters.status);
    }

    sql += " GROUP BY cs.SessionID ORDER BY cs.SessionDate ASC, cs.StartTime ASC";
    
    const [rows] = await pool.query(sql, params);
    return rows;
}

// find details of a specific session for a coach
async function findSessionWithClassDetails(sessionId, coachId) {
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
    return rows.length ? rows[0] : null;
}

// update the status of a specific session (e.g., CANCELLED, COMPLETED)
async function updateSessionStatus(sessionId, status) {
    const [result] = await pool.query("UPDATE classsession SET Status = ? WHERE SessionID = ?", [status, sessionId]);
    return result.affectedRows > 0;
}

// find a session record by its class and date
async function findSessionByClassAndDate(classId, sessionDate) {
    const [rows] = await pool.query(
        `SELECT SessionID, ClassID, SessionDate, StartTime, EndTime, Status
         FROM classsession
         WHERE ClassID = ? AND SessionDate = ?`,
        [classId, sessionDate]
    );
    return rows.length ? rows[0] : null;
}

// get list of sessions that were cancelled by coaches but not yet reviewed by admin
async function listRecentCancellations() {
    const [rows] = await pool.query(`
        SELECT cs.SessionID as id, c.ClassID as class_id, c.Title as className, cs.SessionDate as date,
               DATE_FORMAT(cs.StartTime, '%H:%i') as startTime, DATE_FORMAT(cs.EndTime, '%H:%i') as endTime,
               u.FirstName as coachFirst, u.LastName as coachLast, s.SportName as sport
        FROM classsession cs
        JOIN class c ON cs.ClassID = c.ClassID
        JOIN coach co ON c.CoachID = co.CoachID
        JOIN useraccount u ON co.UserID = u.UserID
        JOIN sport s ON c.SportID = s.SportID
        WHERE cs.Status = 'CANCELLED' AND cs.IsAcknowledged = 0
        ORDER BY cs.SessionDate DESC
    `);
    return rows;
}

// get full history of all cancelled sessions for audit
async function listCancelledHistory() {
    const [rows] = await pool.query(`
        SELECT cs.SessionID as id, c.ClassID as class_id, c.Title as className, cs.SessionDate as date,
               DATE_FORMAT(cs.StartTime, '%H:%i') as startTime, DATE_FORMAT(cs.EndTime, '%H:%i') as endTime,
               u.FirstName as coachFirst, u.LastName as coachLast, s.SportName as sport,
               cs.IsAcknowledged as acknowledged
        FROM classsession cs
        JOIN class c ON cs.ClassID = c.ClassID
        JOIN coach co ON c.CoachID = co.CoachID
        JOIN useraccount u ON co.UserID = u.UserID
        JOIN sport s ON c.SportID = s.SportID
        WHERE cs.Status = 'CANCELLED'
        ORDER BY cs.SessionDate DESC
    `);
    return rows;
}

// mark a cancelled session as reviewed by an admin
async function acknowledgeCancellation(sessionId) {
    const [result] = await pool.query("UPDATE classsession SET IsAcknowledged = 1 WHERE SessionID = ?", [sessionId]);
    return result.affectedRows > 0;
}

module.exports = {
    getWeeklySessionDates,
    checkCourtConflicts,
    checkCoachConflicts,
    createClass,
    updateClass,
    listAllClasses,
    listSessionsForCalendar,
    listAvailableForPlayer,
    listEnrolledForPlayer,
    updateStatus,
    findById,
    listByCoachId,
    findSessionsByCoach,
    findSessionWithClassDetails,
    updateSessionStatus,
    findSessionByClassAndDate,
    listRecentCancellations,
    listCancelledHistory,
    acknowledgeCancellation
};

