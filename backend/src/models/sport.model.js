const { pool } = require("../config/db");

// helper to clean up text input
function normalizeText(name) {
    return String(name || "").trim();
}

// insert a new sport category with a specific UI color
async function createSport(sportName, colorCode = '#1976d2', isBookable = 1, conn = pool) {
    const name = normalizeText(sportName);
    const color = normalizeText(colorCode) || '#1976d2';
    if (!name) return null;

    const [result] = await conn.query(`INSERT INTO sport (SportName, ColorCode, IsBookable) VALUES (?, ?, ?)`, [name, color, isBookable]);
    
    const [rows] = await conn.query(`SELECT SportID, SportName, ColorCode, IsActive, IsBookable FROM sport WHERE SportID = ? LIMIT 1`, [result.insertId]);
    return rows.length ? rows[0] : null;
}

// ensure a sport category exists
async function createSportIfNotExists(sportName, colorCode = '#1976d2', isBookable = 1, conn = pool) {
    const name = normalizeText(sportName);
    const color = normalizeText(colorCode) || '#1976d2';
    if (!name) return null;

    await conn.query(`INSERT IGNORE INTO sport (SportName, ColorCode, IsBookable) VALUES (?, ?, ?)`, [name, color, isBookable]);

    const [rows] = await conn.query(`SELECT SportID, SportName, ColorCode, IsActive, IsBookable FROM sport WHERE SportName = ? LIMIT 1`, [name]);
    return rows.length ? rows[0] : null;
}

// get a list of active sports for selection
async function listSports(search = "", conn = pool) {
    const q = `%${normalizeText(search)}%`;
    const [rows] = await conn.query(
        `SELECT SportID, SportName, ColorCode, IsActive, IsBookable
     FROM sport
     WHERE IsActive = TRUE AND SportName LIKE ?
     ORDER BY SportName ASC
     LIMIT 50`,
        [q]
    );
    return rows;
}

// look up the internal ID of a sport by its label
async function getSportIdByName(sportName, conn = pool) {
    const name = normalizeText(sportName);
    const [rows] = await conn.query(`SELECT SportID FROM sport WHERE SportName = ? LIMIT 1`, [name]);
    return rows.length ? rows[0].SportID : null;
}

// get full details for a specific sport
async function getSportById(sportId, conn = pool) {
    const [rows] = await conn.query(`SELECT SportID, SportName, ColorCode, IsActive, IsBookable FROM sport WHERE SportID = ? LIMIT 1`, [sportId]);
    return rows.length ? rows[0] : null;
}

// modify sport name, color, or bookable status
async function updateSport(sportId, sportName, colorCode, isBookable, conn = pool) {
    const name = normalizeText(sportName);
    const color = normalizeText(colorCode) || '#1976d2';
    if (!name) return false;

    const [result] = await conn.query(
        `UPDATE sport SET SportName = ?, ColorCode = ?, IsBookable = ? WHERE SportID = ?`,
        [name, color, isBookable, sportId]
    );
    return result.affectedRows > 0;
}

// remove a sport category from the system
async function deleteSport(sportId, conn = pool) {
    const [result] = await conn.query(`DELETE FROM sport WHERE SportID = ?`, [sportId]);
    return result.affectedRows > 0;
}

// get all sports a specific coach is qualified to teach
async function listByCoachId(coachId, conn = pool) {
    const [rows] = await conn.query(`
        SELECT s.SportID, s.SportName, s.ColorCode
        FROM sport s
        JOIN coachsport cs ON s.SportID = cs.SportID
        WHERE cs.CoachID = ?
    `, [coachId]);
    return rows;
}

module.exports = {
    createSport,
    createSportIfNotExists,
    listSports,
    getSportIdByName,
    getSportById,
    updateSport,
    deleteSport,
    listByCoachId
};

