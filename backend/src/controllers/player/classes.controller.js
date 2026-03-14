const db = require("../../config/db");

exports.getAvailableClasses = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [rows] = await db.query(
            `SELECT c.ClassID, c.Title, c.StartDate, c.Capacity, c.Fee, c.BillingType,
                    s.SportName,
                    co.CoachID, ua.FirstName AS CoachFirstName, ua.LastName AS CoachLastName,
                    crt.CourtName,
                    (SELECT COUNT(*) FROM enrollment e WHERE e.ClassID = c.ClassID AND e.Status = 'ENROLLED') AS EnrolledCount
             FROM class c
             JOIN sport s ON c.SportID = s.SportID
             JOIN coach co ON c.CoachID = co.CoachID
             JOIN useraccount ua ON co.UserID = ua.UserID
             JOIN court crt ON c.CourtID = crt.CourtID
             WHERE c.Status = 'ACTIVE'
             AND c.ClassID NOT IN (
                 SELECT ClassID FROM enrollment WHERE UserID = ? AND Status = 'ENROLLED'
             )
             ORDER BY c.StartDate ASC`,
            [userId]
        );

        res.json({ classes: rows });
    } catch (err) {
        next(err);
    }
};

exports.enrollInClass = async (req, res, next) => {
    try {
        const classId = Number(req.params.id);
        const userId = req.user.userId;

        if (!Number.isFinite(classId)) {
            return res.status(400).json({ message: "Invalid class ID" });
        }

        const [[classData]] = await db.query(
            `SELECT Capacity,
             (SELECT COUNT(*) FROM enrollment WHERE ClassID = ? AND Status = 'ENROLLED') as CurrentEnrolled
             FROM class WHERE ClassID = ? AND Status = 'ACTIVE'`,
            [classId, classId]
        );

        if (!classData) {
            return res.status(404).json({ message: "Class not found or not active" });
        }
        if (classData.CurrentEnrolled >= classData.Capacity) {
            return res.status(400).json({ message: "Class is full" });
        }

        await db.query(
            `INSERT INTO enrollment (ClassID, UserID, Status) 
             VALUES (?, ?, 'ENROLLED')
             ON DUPLICATE KEY UPDATE Status = 'ENROLLED'`,
            [classId, userId]
        );

        res.status(201).json({ message: "Successfully enrolled in class" });
    } catch (err) {
        next(err);
    }
};

exports.getMyClasses = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [rows] = await db.query(
            `SELECT e.EnrollmentID, e.EnrolledAt, e.Status AS EnrollmentStatus,
                    c.ClassID, c.Title, c.StartDate, c.Fee, c.BillingType, c.Status AS ClassStatus,
                    s.SportName,
                    ua.FirstName AS CoachFirstName, ua.LastName AS CoachLastName,
                    crt.CourtName
             FROM enrollment e
             JOIN class c ON e.ClassID = c.ClassID
             JOIN sport s ON c.SportID = s.SportID
             JOIN coach co ON c.CoachID = co.CoachID
             JOIN useraccount ua ON co.UserID = ua.UserID
             JOIN court crt ON c.CourtID = crt.CourtID
             WHERE e.UserID = ?
             ORDER BY e.EnrolledAt DESC`,
            [userId]
        );

        res.json({ enrollments: rows });
    } catch (err) {
        next(err);
    }
};
