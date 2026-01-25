const { pool } = require("../config/db");

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT UserID, FirstName, LastName, Email, PasswordHash, PhoneNumber, Role, IsActive, CreatedAt
     FROM UserAccount
     WHERE Email = ?`,
    [email]
  );
  return rows.length ? rows[0] : null;
}

async function findById(userId) {
  const [rows] = await pool.query(
    `SELECT UserID, FirstName, LastName, Email, PhoneNumber, Role, IsActive, CreatedAt
     FROM UserAccount
     WHERE UserID = ?`,
    [userId]
  );
  return rows.length ? rows[0] : null;
}

async function emailExists(email) {
  const [rows] = await pool.query(
    `SELECT 1 FROM UserAccount WHERE Email = ? LIMIT 1`,
    [email]
  );
  return rows.length > 0;
}

async function createUser({ firstName, lastName, email, passwordHash, phoneNumber, role }) {
  const [result] = await pool.query(
    `INSERT INTO UserAccount (FirstName, LastName, Email, PasswordHash, PhoneNumber, Role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, email, passwordHash, phoneNumber, role]
  );
  return result.insertId;
}

module.exports = {
  findByEmail,
  findById,
  emailExists,
  createUser
};
