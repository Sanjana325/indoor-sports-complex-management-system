const { pool } = require("../config/db");

async function listBlockedSlots(search = "", conn = pool) {
    const q = `%${String(search || "").trim()}%`;
    const [rows] = await conn.query(
        `
    SELECT 
        bs.BlockedSlotID,
        bs.CourtID,
        c.CourtName,
        bs.StartDateTime,
        bs.EndDateTime,
        bs.Reason,
        bs.CreatedBy,
        u.FirstName AS CreatedByFirstName,
        u.LastName AS CreatedByLastName,
        bs.CreatedAt
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

async function createBlockedSlot({ courtId, startDateTime, endDateTime, reason, createdBy }, conn = pool) {
    const [result] = await conn.query(
        `INSERT INTO blockedslot (CourtID, StartDateTime, EndDateTime, Reason, CreatedBy)
         VALUES (?, ?, ?, ?, ?)`,
        [courtId, startDateTime, endDateTime, reason, createdBy]
    );
    return result.insertId;
}

async function updateBlockedSlot(id, { courtId, startDateTime, endDateTime, reason }, conn = pool) {
    const sets = [];
    const params = [];

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

async function deleteBlockedSlot(id, conn = pool) {
    const [result] = await conn.query(`DELETE FROM blockedslot WHERE BlockedSlotID = ?`, [id]);
    return result.affectedRows > 0;
}

module.exports = {
    listBlockedSlots,
    createBlockedSlot,
    updateBlockedSlot,
    deleteBlockedSlot
};
