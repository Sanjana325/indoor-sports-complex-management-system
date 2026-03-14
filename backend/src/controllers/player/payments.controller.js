const db = require("../../config/db");

exports.getMyPayments = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [rows] = await db.query(
            `SELECT PaymentID, Amount, Method, Status, PaidAt, VerifiedAt
             FROM payment
             WHERE UserID = ?
             ORDER BY PaidAt DESC`,
            [userId]
        );

        res.json({ payments: rows });
    } catch (err) {
        next(err);
    }
};
