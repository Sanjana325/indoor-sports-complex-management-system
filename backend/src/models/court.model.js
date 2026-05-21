const { pool } = require("../config/db");

// check if a court name is already taken
async function existsByName(name, excludeId = null, conn = pool) {
    let sql = `SELECT 1 FROM court WHERE CourtName = ?`;
    const params = [name];
    if (excludeId) {
        sql += ` AND CourtID <> ?`;
        params.push(excludeId);
    }
    const [rows] = await conn.query(sql, params);
    return rows.length > 0;
}

// insert a new court record
async function createCourt({ name, capacity, pricePerHour }, conn = pool) {
    const [result] = await conn.query(
        `INSERT INTO court (CourtName, Capacity, PricePerHour)
     VALUES (?, ?, ?)`,
        [name, capacity, pricePerHour]
    );
    return result.insertId;
}

// link specific sports to a court (many-to-many)
async function addSportsToCourt(courtId, sportIds, conn = pool) {
    if (!sportIds || sportIds.length === 0) return;

    const values = sportIds.map((sportId) => [courtId, sportId]);
    await conn.query(
        `INSERT INTO court_sport (CourtID, SportID) VALUES ?`,
        [values]
    );
}

// get all courts with their supported sports
async function listCourts(search = "", conn = pool) {
    const q = `%${String(search || "").trim()}%`;
    const [rows] = await conn.query(
        `
    SELECT c.CourtID, c.CourtName, c.Capacity, c.PricePerHour,
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

// update court capacity, price, or name
async function updateCourt(courtId, fields, conn = pool) {
    const sets = [];
    const params = [];

    // dynamically build update query based on fields provided
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

// sync the list of supported sports for a court
async function replaceCourtSports(courtId, sportIds, conn = pool) {
    await conn.query(`DELETE FROM court_sport WHERE CourtID = ?`, [courtId]);

    if (!sportIds || sportIds.length === 0) return;

    const values = sportIds.map((sportId) => [courtId, sportId]);
    await conn.query(
        `INSERT INTO court_sport (CourtID, SportID) VALUES ?`,
        [values]
    );
}

// completely remove a court and its sport links
async function deleteCourtHard(courtId, conn = pool) {
    await conn.query(`DELETE FROM court_sport WHERE CourtID = ?`, [courtId]);

    const [result] = await conn.query(`DELETE FROM court WHERE CourtID = ?`, [courtId]);
    return result.affectedRows > 0;
}

// get all courts that support a specific sport (e.g. for booking)
async function listBySport(sportId, conn = pool) {
    const [rows] = await conn.query(
        `SELECT c.CourtID, c.CourtName, c.Capacity, c.PricePerHour
         FROM court c
         JOIN court_sport cs ON c.CourtID = cs.CourtID
         WHERE cs.SportID = ?`,
        [sportId]
    );
    return rows;
}

module.exports = {
    createCourt,
    existsByName,
    addSportsToCourt,
    listCourts,
    updateCourt,
    replaceCourtSports,
    deleteCourtHard,
    listBySport
};

