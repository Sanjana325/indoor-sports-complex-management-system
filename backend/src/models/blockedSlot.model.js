const { pool } = require("../config/db");

// get all court maintenance blocks 
async function listBlockedSlots(search = "", conn = pool) {
    const q = `%${String(search || "").trim()}%`;
    const [rows] = await conn.query(
        `
    SELECT 
        bs.BlockedSlotID AS blockedSlotId,
        bs.CourtID AS courtId,
        c.CourtName AS courtName,
        bs.StartDateTime AS startDateTime,
        bs.EndDateTime AS endDateTime,
        bs.Reason AS reason,
        bs.CreatedBy AS createdBy,
        u.FirstName AS createdByFirstName,
        u.LastName AS createdByLastName,
        bs.CreatedAt AS createdAt
    FROM blockedslot bs
    JOIN court c ON bs.CourtID = c.CourtID
    JOIN useraccount u ON bs.CreatedBy = u.UserID
    WHERE c.CourtName LIKE ? OR bs.Reason LIKE ?
    ORDER BY bs.BlockedSlotID DESC
    `,
        [q, q]
    );
    return rows;
}

// reserve a time slot on a court for maintenance or events
async function createBlockedSlot({ courtId, startDateTime, endDateTime, reason, createdBy }, conn = pool) {
    const [result] = await conn.query(
        `INSERT INTO blockedslot (CourtID, StartDateTime, EndDateTime, Reason, CreatedBy)
         VALUES (?, ?, ?, ?, ?)`,
        [courtId, startDateTime, endDateTime, reason, createdBy]
    );
    return result.insertId;
}

// update details of an existing blocked slot
async function updateBlockedSlot(id, { courtId, startDateTime, endDateTime, reason }, conn = pool) {
    const sets = [];
    const params = [];

    // dynamically build the update query based on provided fields
    if (courtId !== undefined) {
        sets.push("CourtID = ?");
        params.push(courtId);
    }
    if (startDateTime !== undefined) {
        sets.push("StartDateTime = ?");
        params.push(startDateTime);
    }
    if (endDateTime !== undefined) {
        sets.push("EndDateTime = ?");
        params.push(endDateTime);
    }
    if (reason !== undefined) {
        sets.push("Reason = ?");
        params.push(reason);
    }

    if (sets.length === 0) return true;

    params.push(id);
    const [result] = await conn.query(
        `UPDATE blockedslot SET ${sets.join(", ")} WHERE BlockedSlotID = ?`,
        params
    );
    return result.affectedRows > 0;
}

// remove a block and free up the court for bookings
async function deleteBlockedSlot(id, conn = pool) {
    const [result] = await conn.query(`DELETE FROM blockedslot WHERE BlockedSlotID = ?`, [id]);
    return result.affectedRows > 0;
}

/**
 * Checks if a proposed time range on a specific court overlaps with 
 * existing confirmed bookings or scheduled class sessions.
 */
async function checkConflicts(courtId, startDateTime, endDateTime, excludeBlockedSlotId = null, conn = pool) {
    // 1. Check for overlapping CONFIRMED or PENDING bookings
    // Logic: (StartDateTime < ProposedEnd) AND (EndDateTime > ProposedStart)
    const [bookings] = await conn.query(
        `SELECT BookingID 
         FROM booking 
         WHERE CourtID = ? 
           AND Status NOT IN ('CANCELLED', 'EXPIRED')
           AND (StartDateTime < ? AND EndDateTime > ?)`,
        [courtId, endDateTime, startDateTime]
    );

    if (bookings.length > 0) {
        return { conflict: true, type: 'booking', id: bookings[0].BookingID };
    }

    // 2. Check for overlapping class sessions or schedules
    // We check both generated sessions and the underlying recurring schedule
    // Logic: (StartTime < ProposedEnd) AND (EndTime > ProposedStart)
    const [sessions] = await conn.query(
        `SELECT c.Title
         FROM class c
         JOIN class_court cc ON c.ClassID = cc.ClassID
         JOIN classschedule sch ON c.ClassID = sch.ClassID
         LEFT JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
         LEFT JOIN classsession cs ON c.ClassID = cs.ClassID AND cs.SessionDate = DATE(?)
         WHERE cc.CourtID = ?
           AND c.Status = 'ACTIVE'
           AND (
             (sch.ScheduleType = 'ONE_TIME' AND sch.OneTimeDate = DATE(?))
             OR
             (sch.ScheduleType = 'WEEKLY' AND csd.Weekday = (DAYOFWEEK(?) - 1) AND c.StartDate <= DATE(?))
           )
           AND (cs.Status IS NULL OR cs.Status != 'CANCELLED')
           AND (sch.StartTime < TIME(?) AND sch.EndTime > TIME(?))`,
        [startDateTime, courtId, startDateTime, startDateTime, startDateTime, endDateTime, startDateTime]
    );

    if (sessions.length > 0) {
        return { conflict: true, type: 'class', title: sessions[0].Title };
    }

    // 3. Check for overlapping BLOCKED slots
    let blockedQuery = `SELECT BlockedSlotID FROM blockedslot WHERE CourtID = ? AND (StartDateTime < ? AND EndDateTime > ?)`;
    const blockedParams = [courtId, endDateTime, startDateTime];

    if (excludeBlockedSlotId) {
        blockedQuery += ` AND BlockedSlotID <> ?`;
        blockedParams.push(excludeBlockedSlotId);
    }

    const [blocked] = await conn.query(blockedQuery, blockedParams);
    if (blocked.length > 0) {
        return { conflict: true, type: 'blocked_slot', id: blocked[0].BlockedSlotID };
    }

    return { conflict: false };
}

module.exports = {
    listBlockedSlots,
    createBlockedSlot,
    updateBlockedSlot,
    deleteBlockedSlot,
    checkConflicts
};

