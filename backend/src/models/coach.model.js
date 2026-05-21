const { pool } = require("../config/db");

// helper to clean up text input
function normalizeText(name) {
  return String(name || "").trim();
}

// helper to get a list of unique non-empty strings
function uniqueNonEmpty(list) {
  const arr = Array.isArray(list) ? list : [];
  const cleaned = arr.map(normalizeText).filter(Boolean);
  return Array.from(new Set(cleaned));
}

// helper to get unique positive integers from a list
function uniquePositiveInts(list) {
  const arr = Array.isArray(list) ? list : [];
  const nums = arr
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
  return Array.from(new Set(nums));
}

// create a new coach profile linked to a user account
async function createCoach({ userId }, conn = pool) {
  const [result] = await conn.query(`INSERT INTO Coach (UserID) VALUES (?)`, [userId]);
  return result.insertId;
}

// find the internal coach ID for a given user
async function getCoachIdByUserId(userId, conn = pool) {
  const [rows] = await conn.query(`SELECT CoachID FROM Coach WHERE UserID = ? LIMIT 1`, [userId]);
  return rows.length ? rows[0].CoachID : null;
}

// find or create a qualification record by name
async function upsertQualificationIdByName(qualificationName, conn = pool) {
  const name = normalizeText(qualificationName);
  if (!name) return null;

  await conn
    .query(`INSERT INTO Qualification (QualificationName) VALUES (?)`, [name])
    .catch(() => { });

  const [rows] = await conn.query(
    `SELECT QualificationID FROM Qualification WHERE QualificationName = ? LIMIT 1`,
    [name]
  );

  return rows.length ? rows[0].QualificationID : null;
}

// find or create a sport record by name
async function upsertSportIdByName(sportName, conn = pool) {
  const name = normalizeText(sportName);
  if (!name) return null;

  await conn
    .query(`INSERT INTO Sport (SportName) VALUES (?)`, [name])
    .catch(() => { });

  const [rows] = await conn.query(`SELECT SportID FROM Sport WHERE SportName = ? LIMIT 1`, [name]);
  return rows.length ? rows[0].SportID : null;
}

// link a coach to multiple qualifications using IDs
async function setCoachQualificationsByIds(coachId, qualificationIds, conn = pool) {
  const ids = uniquePositiveInts(qualificationIds);

  await conn.query(`DELETE FROM CoachQualification WHERE CoachID = ?`, [coachId]);
  if (!ids.length) return;

  for (const qid of ids) {
    await conn.query(
      `INSERT IGNORE INTO CoachQualification (CoachID, QualificationID) VALUES (?, ?)`,
      [coachId, qid]
    );
  }
}

// link a coach to multiple qualifications using their names (syncs profile)
async function setCoachQualificationsByNames(coachId, qualificationNames, conn = pool) {
  const list = uniqueNonEmpty(qualificationNames);

  // remove old links and add new ones to sync the coach's profile
  await conn.query(`DELETE FROM CoachQualification WHERE CoachID = ?`, [coachId]);
  if (!list.length) return;

  for (const q of list) {
    const qualificationId = await upsertQualificationIdByName(q, conn);
    if (!qualificationId) continue;

    await conn.query(
      `INSERT IGNORE INTO CoachQualification (CoachID, QualificationID) VALUES (?, ?)`,
      [coachId, qualificationId]
    );
  }
}

// link a coach to multiple sports specializations using IDs
async function setCoachSportsByIds(coachId, sportIds, conn = pool) {
  const ids = uniquePositiveInts(sportIds);

  await conn.query(`DELETE FROM CoachSport WHERE CoachID = ?`, [coachId]);
  if (!ids.length) return;

  for (const sid of ids) {
    await conn.query(`INSERT IGNORE INTO CoachSport (CoachID, SportID) VALUES (?, ?)`, [coachId, sid]);
  }
}

// link a coach to multiple sports specializations using their names
async function setCoachSportsByNames(coachId, sportNames, conn = pool) {
  const list = uniqueNonEmpty(sportNames);

  await conn.query(`DELETE FROM CoachSport WHERE CoachID = ?`, [coachId]);
  if (!list.length) return;

  for (const s of list) {
    const sportId = await upsertSportIdByName(s, conn);
    if (!sportId) continue;

    await conn.query(`INSERT IGNORE INTO CoachSport (CoachID, SportID) VALUES (?, ?)`, [coachId, sportId]);
  }
}

// remove a coach profile and all their qualification/sport links
async function deleteCoachAndLinksByUserId(userId, conn = pool) {
  const coachId = await getCoachIdByUserId(userId, conn);
  if (!coachId) return;

  await conn.query(`DELETE FROM CoachQualification WHERE CoachID = ?`, [coachId]);
  await conn.query(`DELETE FROM CoachSport WHERE CoachID = ?`, [coachId]);
  await conn.query(`DELETE FROM Coach WHERE CoachID = ?`, [coachId]);
}

// search for available qualifications
async function listQualifications(search = "", conn = pool) {
  const q = `%${normalizeText(search)}%`;
  const [rows] = await conn.query(
    `SELECT QualificationID, QualificationName
     FROM Qualification
     WHERE QualificationName LIKE ?
     ORDER BY QualificationName ASC
     LIMIT 50`,
    [q]
  );
  return rows;
}

// ensure a qualification exists and return its details
async function createQualificationIfNotExists(qualificationName, conn = pool) {
  const qualificationId = await upsertQualificationIdByName(qualificationName, conn);
  if (!qualificationId) return null;

  const [rows] = await conn.query(
    `SELECT QualificationID, QualificationName
     FROM Qualification
     WHERE QualificationID = ?
     LIMIT 1`,
    [qualificationId]
  );
  return rows.length ? rows[0] : null;
}

// get a list of active coaches for dropdown menus and assignments
async function listAllForSelection(conn = pool) {
  const [coaches] = await conn.query(`
      SELECT c.CoachID as id, u.FirstName as firstName, u.LastName as lastName,
             GROUP_CONCAT(DISTINCT s.SportName ORDER BY s.SportName SEPARATOR ',') AS sports
      FROM coach c
      JOIN useraccount u ON c.UserID = u.UserID
      LEFT JOIN coachsport cs ON c.CoachID = cs.CoachID
      LEFT JOIN sport s ON cs.SportID = s.SportID
      WHERE u.IsActive = 1
      GROUP BY c.CoachID, c.UserID, u.FirstName, u.LastName
  `);
  return coaches;
}

module.exports = {
  createCoach,
  getCoachIdByUserId,
  setCoachQualificationsByIds,
  setCoachQualificationsByNames,
  setCoachSportsByIds,
  setCoachSportsByNames,
  deleteCoachAndLinksByUserId,
  listQualifications,
  createQualificationIfNotExists,
  listAllForSelection
};

