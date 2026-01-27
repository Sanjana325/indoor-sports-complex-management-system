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

async function emailExistsExceptUser(email, userId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM UserAccount WHERE Email = ? AND UserID <> ? LIMIT 1`,
    [email, userId]
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

async function updateUserById(userId, { firstName, lastName, email, phoneNumber, role }) {
  await pool.query(
    `UPDATE UserAccount
     SET FirstName = ?, LastName = ?, Email = ?, PhoneNumber = ?, Role = ?
     WHERE UserID = ?`,
    [firstName, lastName, email, phoneNumber, role, userId]
  );
}

async function listAllForAdmin() {
  const [rows] = await pool.query(
    `SELECT 
        ua.UserID,
        ua.FirstName,
        ua.LastName,
        ua.Email,
        ua.PhoneNumber,
        ua.Role,
        ua.IsActive,
        ua.CreatedAt,
        ua.MustChangePassword,
        c.Specialization
     FROM UserAccount ua
     LEFT JOIN Coach c ON c.UserID = ua.UserID
     ORDER BY ua.CreatedAt DESC`
  );
  return rows;
}

/* Forgot Password token methods */

async function createPasswordResetToken({ userId, tokenHash, expiresAt }) {
  await pool.query(
    `INSERT INTO PasswordResetToken (UserID, TokenHash, ExpiresAt)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
}

async function findValidPasswordResetTokenByHash(tokenHash) {
  const [rows] = await pool.query(
    `SELECT ResetID, UserID, TokenHash, ExpiresAt, UsedAt
     FROM PasswordResetToken
     WHERE TokenHash = ?
       AND UsedAt IS NULL
       AND ExpiresAt > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return rows.length ? rows[0] : null;
}

async function markPasswordResetTokenUsed(resetId) {
  await pool.query(
    `UPDATE PasswordResetToken
     SET UsedAt = NOW()
     WHERE ResetID = ?`,
    [resetId]
  );
}

module.exports = {
  findByEmail,
  findById,
  emailExists,
  emailExistsExceptUser,
  createUser,
  updateUserById,
  listAllForAdmin,
  createPasswordResetToken,
  findValidPasswordResetTokenByHash,
  markPasswordResetTokenUsed
};
