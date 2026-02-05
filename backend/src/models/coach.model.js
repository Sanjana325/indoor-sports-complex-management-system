const { pool } = require("../config/db");

function normalizeQualification(name) {
  return String(name || "").trim();
}

function uniqueNonEmptyQualifications(list) {
  const arr = Array.isArray(list) ? list : [];
  const cleaned = arr
    .map(normalizeQualification)
    .filter(Boolean);

  return Array.from(new Set(cleaned));
}

async function createCoach({ userId, specialization }, conn = pool) {
  const [result] = await conn.query(
    `INSERT INTO Coach (UserID, Specialization) VALUES (?, ?)`,
    [userId, specialization]
  );
  return result.insertId;
}

async function getCoachIdByUserId(userId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT CoachID FROM Coach WHERE UserID = ? LIMIT 1`,
    [userId]
  );
  return rows.length ? rows[0].CoachID : null;
}

async function updateCoachSpecializationByUserId(userId, specialization, conn = pool) {
  await conn.query(
    `UPDATE Coach SET Specialization = ? WHERE UserID = ?`,
    [specialization, userId]
  );
}

async function upsertQualificationIdByName(qualificationName, conn = pool) {
  const name = normalizeQualification(qualificationName);
  if (!name) return null;

  await conn.query(
    `INSERT INTO Qualification (QualificationName) VALUES (?)`,
    [name]
  ).catch(() => {});

  const [rows] = await conn.query(
    `SELECT QualificationID FROM Qualification WHERE QualificationName = ? LIMIT 1`,
    [name]
  );

  return rows.length ? rows[0].QualificationID : null;
}

async function setCoachQualifications(coachId, qualifications, conn = pool) {
  const list = uniqueNonEmptyQualifications(qualifications);

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

async function deleteCoachAndLinksByUserId(userId, conn = pool) {
  const coachId = await getCoachIdByUserId(userId, conn);
  if (!coachId) return;

  await conn.query(`DELETE FROM CoachQualification WHERE CoachID = ?`, [coachId]);
  await conn.query(`DELETE FROM Coach WHERE CoachID = ?`, [coachId]);
}

module.exports = {
  createCoach,
  getCoachIdByUserId,
  updateCoachSpecializationByUserId,
  setCoachQualifications,
  deleteCoachAndLinksByUserId
};
