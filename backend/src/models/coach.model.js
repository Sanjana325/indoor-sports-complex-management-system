const { pool } = require("../config/db");

function normalizeText(name) {
  return String(name || "").trim();
}

function uniqueNonEmpty(list) {
  const arr = Array.isArray(list) ? list : [];
  const cleaned = arr.map(normalizeText).filter(Boolean);
  return Array.from(new Set(cleaned));
}

function uniquePositiveInts(list) {
  const arr = Array.isArray(list) ? list : [];
  const nums = arr
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
  return Array.from(new Set(nums));
}

async function createCoach({ userId }, conn = pool) {
  const [result] = await conn.query(`INSERT INTO Coach (UserID) VALUES (?)`, [userId]);
  return result.insertId;
}

async function getCoachIdByUserId(userId, conn = pool) {
  const [rows] = await conn.query(`SELECT CoachID FROM Coach WHERE UserID = ? LIMIT 1`, [userId]);
  return rows.length ? rows[0].CoachID : null;
}

async function upsertQualificationIdByName(qualificationName, conn = pool) {
  const name = normalizeText(qualificationName);
  if (!name) return null;

  await conn
    .query(`INSERT INTO Qualification (QualificationName) VALUES (?)`, [name])
    .catch(() => {});

  const [rows] = await conn.query(
    `SELECT QualificationID FROM Qualification WHERE QualificationName = ? LIMIT 1`,
    [name]
  );

  return rows.length ? rows[0].QualificationID : null;
}

async function upsertSportIdByName(sportName, conn = pool) {
  const name = normalizeText(sportName);
  if (!name) return null;

  await conn
    .query(`INSERT INTO Sport (SportName) VALUES (?)`, [name])
    .catch(() => {});

  const [rows] = await conn.query(`SELECT SportID FROM Sport WHERE SportName = ? LIMIT 1`, [name]);
  return rows.length ? rows[0].SportID : null;
}

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

async function setCoachQualificationsByNames(coachId, qualificationNames, conn = pool) {
  const list = uniqueNonEmpty(qualificationNames);

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

async function setCoachSportsByIds(coachId, sportIds, conn = pool) {
  const ids = uniquePositiveInts(sportIds);

  await conn.query(`DELETE FROM CoachSport WHERE CoachID = ?`, [coachId]);
  if (!ids.length) return;

  for (const sid of ids) {
    await conn.query(`INSERT IGNORE INTO CoachSport (CoachID, SportID) VALUES (?, ?)`, [coachId, sid]);
  }
}

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

async function deleteCoachAndLinksByUserId(userId, conn = pool) {
  const coachId = await getCoachIdByUserId(userId, conn);
  if (!coachId) return;

  await conn.query(`DELETE FROM CoachQualification WHERE CoachID = ?`, [coachId]);
  await conn.query(`DELETE FROM CoachSport WHERE CoachID = ?`, [coachId]);
  await conn.query(`DELETE FROM Coach WHERE CoachID = ?`, [coachId]);
}

async function listSports(search = "", conn = pool) {
  const q = `%${normalizeText(search)}%`;
  const [rows] = await conn.query(
    `SELECT SportID, SportName
     FROM Sport
     WHERE IsActive = TRUE AND SportName LIKE ?
     ORDER BY SportName ASC
     LIMIT 50`,
    [q]
  );
  return rows;
}

async function createSportIfNotExists(sportName, conn = pool) {
  const sportId = await upsertSportIdByName(sportName, conn);
  if (!sportId) return null;

  const [rows] = await conn.query(
    `SELECT SportID, SportName FROM Sport WHERE SportID = ? LIMIT 1`,
    [sportId]
  );
  return rows.length ? rows[0] : null;
}

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

module.exports = {
  createCoach,
  getCoachIdByUserId,

  setCoachQualificationsByIds,
  setCoachQualificationsByNames,

  setCoachSportsByIds,
  setCoachSportsByNames,

  deleteCoachAndLinksByUserId,

  listSports,
  createSportIfNotExists,

  listQualifications,
  createQualificationIfNotExists
};
