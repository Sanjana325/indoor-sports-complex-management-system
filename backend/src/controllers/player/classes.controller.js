const classModel = require("../../models/class.model");
const { pool } = require("../../config/db");

// get list of all active classes available for enrollment
exports.getAvailableClasses = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const rows = await classModel.listAvailableForPlayer(userId);
        res.json({ classes: rows });
    } catch (err) {
        next(err);
    }
};

// check class details and capacity before showing payment options
exports.enrollInClass = async (req, res, next) => {
    try {
        const classId = Number(req.params.id);
        const userId = req.user.UserID;

        if (!Number.isFinite(classId)) {
            return res.status(400).json({ message: "Invalid class ID" });
        }

        // verify class is active
        const classData = await classModel.findById(classId);
        if (!classData || classData.Status !== 'ACTIVE') {
            return res.status(404).json({ message: "Class not found or not active" });
        }

        // check if class has reached maximum capacity
        const [enrollmentCount] = await pool.query(
            "SELECT COUNT(*) as count FROM enrollment WHERE ClassID = ? AND Status = 'ENROLLED'",
            [classId]
        );
        
        if (enrollmentCount[0].count >= classData.Capacity) {
            return res.status(400).json({ message: "Class is full" });
        }

        res.json({ 
            message: "Class available for enrollment",
            class: {
                ClassID: classData.ClassID,
                Title: classData.Title,
                Fee: classData.Fee,
                Capacity: classData.Capacity,
                CurrentEnrolled: enrollmentCount[0].count
            }
        });
    } catch (err) {
        next(err);
    }
};

// get list of all classes the player is currently enrolled in
exports.getMyClasses = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const rows = await classModel.listEnrolledForPlayer(userId);
        res.json({ enrollments: rows });
    } catch (err) {
        next(err);
    }
};

// cancel enrollment and stop future billing for a class
exports.leaveClass = async (req, res, next) => {
    try {
        const enrollmentId = req.params.id;
        const userId = req.user.UserID;

        // update status to cancelled
        const [result] = await pool.query(
            "UPDATE enrollment SET Status = 'CANCELLED' WHERE EnrollmentID = ? AND UserID = ?",
            [enrollmentId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        res.json({ message: "Successfully left the class. Recurring billing has been stopped." });
    } catch (err) {
        next(err);
    }
};

