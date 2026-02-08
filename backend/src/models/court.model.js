const { pool } = require("../config/db");

async function createCourt({ name, capacity, pricePerHour, status = "AVAILABLE" }, conn = pool) {
    const [result] = await conn.query(
        `INSERT INTO court (CourtName, Capacity, PricePerHour, Status)
     VALUES (?, ?, ?, ?)`,
        [name, capacity, pricePerHour, status]
    );
    return result.insertId;
}

async function addSportsToCourt(courtId, sportIds, conn = pool) {
    if (!sportIds || sportIds.length === 0) return;

    const values = sportIds.map((sportId) => [courtId, sportId]);
    await conn.query(
        `INSERT INTO court_sport (CourtID, SportID) VALUES ?`,
        [values]
    );
}

async function listCourts(search = "", conn = pool) {
    const q = `%${String(search || "").trim()}%`;
    const [rows] = await conn.query(
        `
    SELECT c.CourtID, c.CourtName, c.Capacity, c.PricePerHour, c.Status,
           GROUP_CONCAT(s.SportName ORDER BY s.SportName SEPARATOR ', ') AS Sports
    FROM court c
    LEFT JOIN court_sport cs ON c.CourtID = cs.CourtID
    LEFT JOIN sport s ON cs.SportID = s.SportID
    WHERE c.CourtName LIKE ?
    GROUP BY c.CourtID
    ORDER BY c.CourtID DESC
    `,
        [q]
    );
    return rows;
}

async function updateCourt(courtId, fields, conn = pool) {
    const sets = [];
    const params = [];

    if (fields.name !== undefined) {
        sets.push("CourtName = ?");
        params.push(fields.name);
    }
    if (fields.capacity !== undefined) {
        sets.push("Capacity = ?");
        params.push(fields.capacity);
    }
    if (fields.pricePerHour !== undefined) {
        sets.push("PricePerHour = ?");
        params.push(fields.pricePerHour);
    }
    if (fields.status !== undefined) {
        sets.push("Status = ?");
        params.push(fields.status);
    }

    if (sets.length === 0) {
        const [exists] = await conn.query(`SELECT CourtID FROM court WHERE CourtID = ? LIMIT 1`, [courtId]);
        return exists.length > 0;
    }

    params.push(courtId);

    const [result] = await conn.query(
        `UPDATE court SET ${sets.join(", ")} WHERE CourtID = ?`,
        params
    );
    return result.affectedRows > 0;
}

async function replaceCourtSports(courtId, sportIds, conn = pool) {
    await conn.query(`DELETE FROM court_sport WHERE CourtID = ?`, [courtId]);

    if (!sportIds || sportIds.length === 0) return;

    const values = sportIds.map((sportId) => [courtId, sportId]);
    await conn.query(
        `INSERT INTO court_sport (CourtID, SportID) VALUES ?`,
        [values]
    );
}

async function deleteCourtHard(courtId, conn = pool) {
    await conn.query(`DELETE FROM court_sport WHERE CourtID = ?`, [courtId]);

    const [result] = await conn.query(`DELETE FROM court WHERE CourtID = ?`, [courtId]);
    return result.affectedRows > 0;
}

module.exports = {
    createCourt,
    addSportsToCourt,
    listCourts,
    updateCourt,
    replaceCourtSports,
    deleteCourtHard
};
