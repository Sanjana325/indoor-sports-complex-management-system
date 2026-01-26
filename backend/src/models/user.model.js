const { pool } = require("../config/db");

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT UserID, FirstName, LastName, Email, PasswordHash, PhoneNumber, Role, IsActive, CreatedAt, MustChangePassword
     FROM UserAccount
     WHERE Email = ?`,
    [email]
  );
  return rows.length ? rows[0] : null;
}

async function findById(userId) {
  const [rows] = await pool.query(
    `SELECT UserID, FirstName, LastName, Email, PasswordHash, PhoneNumber, Role, IsActive, CreatedAt, MustChangePassword
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

async function createUser({
  firstName,
  lastName,
  email,
  passwordHash,
  phoneNumber,
  role,
  mustChangePassword = false
}) {
  const [result] = await pool.query(
    `INSERT INTO UserAccount (FirstName, LastName, Email, PasswordHash, PhoneNumber, Role, MustChangePassword)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, email, passwordHash, phoneNumber, role, mustChangePassword ? 1 : 0]
  );
  return result.insertId;
}

module.exports = {
  findByEmail,
  findById,
  emailExists,
  createUser
};
