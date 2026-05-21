const { pool } = require("../config/db");

// get a comprehensive list of all student registrations and their fee status
async function findAll() {
    const [rows] = await pool.query(
        `SELECT e.EnrollmentID, e.Status AS EnrollmentStatus, e.EnrolledAt,
                u.FirstName, u.LastName,
                c.Title AS ClassName, c.BillingType,
                em.PeriodMonth, em.Status AS FeeStatus
         FROM enrollment e
         JOIN useraccount u ON e.UserID = u.UserID
         JOIN class c ON e.ClassID = c.ClassID
         LEFT JOIN (
             SELECT EnrollmentID, PeriodMonth, Status
             FROM enrollmentmonth em1
             WHERE EnrollmentMonthID = (
                 SELECT MAX(EnrollmentMonthID)
                 FROM enrollmentmonth em2
                 WHERE em2.EnrollmentID = em1.EnrollmentID
             )
         ) em ON e.EnrollmentID = em.EnrollmentID
         ORDER BY e.EnrolledAt DESC`
    );
    return rows;
}

// find enrollment by ID with student and class details
async function findById(enrollmentId, conn = pool) {
    const [rows] = await conn.query(`
        SELECT e.*, u.Email, u.FirstName, u.LastName, c.Title as ClassName
        FROM enrollment e
        JOIN useraccount u ON e.UserID = u.UserID
        JOIN class c ON e.ClassID = c.ClassID
        WHERE e.EnrollmentID = ?
    `, [enrollmentId]);
    return rows.length ? rows[0] : null;
}

// register a player for a class or re-activate a previous enrollment
async function create({ classId, userId, status }, conn = pool) {
    const [result] = await conn.query(
        `INSERT INTO enrollment (ClassID, UserID, Status) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE Status = ?`,
        [classId, userId, status || 'ENROLLED', status || 'ENROLLED']
    );

    if (result.insertId) return result.insertId;
    
    // handle the case where a user might have previously cancelled and is re-enrolling
    const [existing] = await conn.query(
        "SELECT EnrollmentID FROM enrollment WHERE ClassID = ? AND UserID = ?",
        [classId, userId]
    );
    return existing[0].EnrollmentID;
}

// change enrollment state (e.g. ENROLLED, CANCELLED)
async function updateStatus(enrollmentId, status, conn = pool) {
    const [result] = await conn.query(
        "UPDATE enrollment SET Status = ? WHERE EnrollmentID = ?",
        [status, enrollmentId]
    );
    return result.affectedRows > 0;
}

// generate a billing record for a specific month for a student
async function createMonth({ enrollmentId, periodMonth, feeAmount, status }, conn = pool) {
    const [result] = await conn.query(
        "INSERT INTO enrollmentmonth (EnrollmentID, PeriodMonth, FeeAmount, Status) VALUES (?, ?, ?, ?)",
        [enrollmentId, periodMonth || new Date(), feeAmount, status || 'DUE']
    );
    return result.insertId;
}

// mark a monthly fee as PAID or DUE
async function updateMonthStatus(monthId, status, conn = pool) {
    const [result] = await conn.query("UPDATE enrollmentmonth SET Status = ? WHERE EnrollmentMonthID = ?", [status, monthId]);
    return result.affectedRows > 0;
}

// get a list of active students for a specific class roster
async function listStudentsByClass(classId) {
    const [rows] = await pool.query(`
        SELECT u.UserID as id, u.FirstName, u.LastName, u.Email, u.PhoneNumber, e.EnrolledAt
        FROM enrollment e
        JOIN useraccount u ON e.UserID = u.UserID
        WHERE e.ClassID = ? AND e.Status = 'ENROLLED'
        ORDER BY u.FirstName ASC
    `, [classId]);
    return rows;
}

module.exports = {
    findAll,
    findById,
    create,
    updateStatus,
    createMonth,
    updateMonthStatus,
    listStudentsByClass
};

