const { pool } = require("../config/db");

// get all active classes and coaches for attendance selection
async function listClassesForAttendance() {
    // fetch active classes with sport and coach details
    const [rows] = await pool.query(
        `SELECT c.ClassID, c.Title,
                s.SportName,
                u.FirstName AS CoachFirstName, u.LastName AS CoachLastName
         FROM class c
         JOIN sport s   ON c.SportID = s.SportID
         JOIN coach co  ON c.CoachID = co.CoachID
         JOIN useraccount u ON co.UserID = u.UserID
         WHERE c.Status = 'ACTIVE'
         ORDER BY c.Title`
    );
    return rows;
}

// get student attendance status for a specific class session
async function findSessionAttendance(sessionId, classId) {
    // fetch students enrolled in the class and their attendance mark for the session
    const [rows] = await pool.query(
        `SELECT e.EnrollmentID,
                u.UserID, u.FirstName, u.LastName,
                COALESCE(a.Status, 'NOT_MARKED') AS AttendanceStatus,
                a.MarkedAt
         FROM enrollment e
         JOIN useraccount u ON e.UserID = u.UserID
         LEFT JOIN attendance a ON a.EnrollmentID = e.EnrollmentID
                                AND a.SessionID = ?
         WHERE e.ClassID = ? AND e.Status = 'ENROLLED'
         ORDER BY u.FirstName, u.LastName`,
        [sessionId, classId]
    );
    return rows;
}

// save attendance records for multiple students in a session
async function markBulk(sessionId, marks, conn = pool) {
    for (const mark of marks) {
        // insert or update attendance status for each student
        await conn.query(
            `INSERT INTO attendance (EnrollmentID, SessionID, Status, MarkedAt)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE Status = VALUES(Status), MarkedAt = NOW()`,
            [mark.enrollmentId, sessionId, mark.status]
        );
    }
}

module.exports = {
    listClassesForAttendance,
    findSessionAttendance,
    markBulk
};

