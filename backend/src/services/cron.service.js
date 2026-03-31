const cron = require("node-cron");
const { pool } = require("../config/db");

const initCronJobs = () => {
    // Run every day at midnight (00:00)
    cron.schedule("0 0 * * *", async () => {
        console.log("[Cron] Running 28-day cycle billing check...");
        await processRecurringPayments();
    });
};

const processRecurringPayments = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Find enrollments that need a new 4-week cycle generated
        // Rule: Latest PeriodMonth was 28+ days ago
        const [toGenerate] = await connection.query(`
            SELECT e.EnrollmentID, e.UserID, c.Fee, em.PeriodMonth, em.EnrollmentMonthID
            FROM enrollment e
            JOIN class c ON e.ClassID = c.ClassID
            JOIN (
                SELECT EnrollmentID, MAX(PeriodMonth) as PeriodMonth, MAX(EnrollmentMonthID) as EnrollmentMonthID
                FROM enrollmentmonth
                GROUP BY EnrollmentID
            ) em ON e.EnrollmentID = em.EnrollmentID
            WHERE e.Status = 'ENROLLED'
              AND em.PeriodMonth <= CURDATE() - INTERVAL 28 DAY
        `);

        for (const item of toGenerate) {
            // Check if we already generated a DUE record for this period to avoid duplicates
            const [existing] = await connection.query(
                "SELECT 1 FROM enrollmentmonth WHERE EnrollmentID = ? AND PeriodMonth > ?",
                [item.EnrollmentID, item.PeriodMonth]
            );

            if (existing.length === 0) {
                const nextDate = new Date(item.PeriodMonth);
                nextDate.setDate(nextDate.getDate() + 28);
                const nextDateStr = nextDate.toISOString().split('T')[0];

                await connection.query(
                    "INSERT INTO enrollmentmonth (EnrollmentID, PeriodMonth, FeeAmount, Status) VALUES (?, ?, ?, 'DUE')",
                    [item.EnrollmentID, nextDateStr, item.Fee]
                );
                console.log(`[Cron] Generated new DUE cycle for Enrollment ${item.EnrollmentID} starting ${nextDateStr}`);
            }
        }

        // 2. Mark overdue payments
        // Rule: Status is DUE and CreatedAt was 3+ days ago
        const [result] = await connection.query(`
            UPDATE enrollmentmonth 
            SET Status = 'OVERDUE' 
            WHERE Status = 'DUE' 
              AND CreatedAt < NOW() - INTERVAL 3 DAY
        `);

        if (result.affectedRows > 0) {
            console.log(`[Cron] Marked ${result.affectedRows} payments as OVERDUE.`);
        }

        await connection.commit();
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("[Cron] Error processing recurring payments:", err.message);
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { initCronJobs, processRecurringPayments };
