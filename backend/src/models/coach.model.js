const { pool } = require("../config/db");

async function createCoach({ userId, specialization }) {
  const [result] = await pool.query(
    `INSERT INTO Coach (UserID, Specialization) VALUES (?, ?)`,
    [userId, specialization]
  );
  return result.insertId;
}

module.exports = {
  createCoach
};
