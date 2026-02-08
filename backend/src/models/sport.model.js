const { pool } = require("../config/db");

function normalizeText(name) {
    return String(name || "").trim();
}

async function createSportIfNotExists(sportName, conn = pool) {
    const name = normalizeText(sportName);
    if (!name) return null;

    await conn.query(`INSERT IGNORE INTO sport (SportName) VALUES (?)`, [name]);

    const [rows] = await conn.query(`SELECT SportID, SportName FROM sport WHERE SportName = ? LIMIT 1`, [name]);
    return rows.length ? rows[0] : null;
}

async function listSports(search = "", conn = pool) {
    const q = `%${normalizeText(search)}%`;
    const [rows] = await conn.query(
        `SELECT SportID, SportName
     FROM sport
     WHERE IsActive = TRUE AND SportName LIKE ?
     ORDER BY SportName ASC
     LIMIT 50`,
        [q]
    );
    return rows;
}

async function getSportIdByName(sportName, conn = pool) {
    const name = normalizeText(sportName);
    const [rows] = await conn.query(`SELECT SportID FROM sport WHERE SportName = ? LIMIT 1`, [name]);
    return rows.length ? rows[0].SportID : null;
}

async function getSportById(sportId, conn = pool) {
    const [rows] = await conn.query(`SELECT SportID, SportName FROM sport WHERE SportID = ? LIMIT 1`, [sportId]);
    return rows.length ? rows[0] : null;
}

async function deleteSport(sportId, conn = pool) {
    // Check if any courts use this sport? 
    // If we want to allow deleting, we might need to remove from court_sport first or rely on CASCADE.
    // Assuming strict for now: if used, don't delete? Or just try delete.
    // If FK exists, it might fail. Let's try simple delete.
    const [result] = await conn.query(`DELETE FROM sport WHERE SportID = ?`, [sportId]);
    return result.affectedRows > 0;
}

module.exports = {
    createSportIfNotExists,
    listSports,
    getSportIdByName,
    getSportById,
    deleteSport
};
