const cron = require("node-cron");
const { pool } = require("../config/db");

const initCronJobs = () => {
    // Run every day at midnight (00:00)
    cron.schedule("0 0 * * *", async () => {
        console.log("[Cron] Running 28-day cycle billing check...");
        await processRecurringPayments();
    });

    // Run every 1 minute to check for booking expirations
    cron.schedule("* * * * *", async () => {
        console.log("[Cron] Running booking expiration check...");
        await processBookingExpirations();
    });

    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        console.log("[Cron] Running 1-hour booking & class session reminder checks...");
        await processBookingReminders();
        await processClassSessionReminders();
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

const processBookingReminders = async () => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Find bookings between NOW() and NOW() + 65 minutes that are CONFIRMED and ReminderSent = 0
        const [reminders] = await connection.query(`
            SELECT 
                b.BookingID, 
                b.StartDateTime, 
                b.EndDateTime,
                u.Email, 
                u.FirstName,
                u.LastName,
                s.SportName
            FROM booking b
            JOIN useraccount u ON b.UserID = u.UserID
            JOIN sport s ON b.SportID = s.SportID
            WHERE b.Status = 'CONFIRMED'
              AND b.ReminderSent = 0
              AND b.StartDateTime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 65 MINUTE)
        `);

        if (reminders.length > 0) {
            const emailService = require("./email.service");
            for (const item of reminders) {
                // Format times for email
                const startTime = new Date(item.StartDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const endTime = new Date(item.EndDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const userName = item.FirstName ? `${item.FirstName} ${item.LastName || ''}`.trim() : "Player";

                await emailService.sendCourtBookingReminder({
                    toEmail: item.Email,
                    toName: userName,
                    sportName: item.SportName,
                    startTime: startTime,
                    endTime: endTime
                });

                await connection.query("UPDATE booking SET ReminderSent = 1 WHERE BookingID = ?", [item.BookingID]);
                console.log(`[Cron] Sent 1-Hour Reminder to ${item.Email} for Booking ${item.BookingID}`);
            }
        }
    } catch (err) {
        console.error("[Cron] Error processing booking reminders:", err.message);
    } finally {
        if (connection) connection.release();
    }
};

const processClassSessionReminders = async () => {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Find all class sessions starting in exactly 65 minutes that haven't had a reminder sent yet.
        // Also fetch the Coach info for the session.
        const [sessions] = await connection.query(`
            SELECT 
                cs.SessionID,
                cs.SessionDate,
                cs.StartTime,
                cs.EndTime,
                c.ClassID,
                c.Title as ClassName,
                s.SportName,
                u_coach.Email as CoachEmail,
                u_coach.FirstName as CoachFirstName,
                u_coach.LastName as CoachLastName
            FROM classsession cs
            JOIN class c ON cs.ClassID = c.ClassID
            JOIN sport s ON c.SportID = s.SportID
            JOIN coach co ON c.CoachID = co.CoachID
            JOIN useraccount u_coach ON co.UserID = u_coach.UserID
            WHERE cs.Status = 'SCHEDULED'
              AND cs.ReminderSent = 0
              AND TIMESTAMP(cs.SessionDate, cs.StartTime) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 65 MINUTE)
        `);

        if (sessions.length > 0) {
            const emailService = require("./email.service");

            for (const session of sessions) {
                // Formatting times for email. Example: 15:00:00 to 3:00 PM
                const formattedStartTime = new Date(`1970-01-01T${session.StartTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const formattedEndTime = new Date(`1970-01-01T${session.EndTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                // 2. Notify the Coach first
                const coachName = session.CoachFirstName ? `${session.CoachFirstName} ${session.CoachLastName || ''}`.trim() : "Coach";
                await emailService.sendCoachClassSessionReminder({
                    toEmail: session.CoachEmail,
                    toName: coachName,
                    className: session.ClassName,
                    sportName: session.SportName,
                    startTime: formattedStartTime,
                    endTime: formattedEndTime
                });
                console.log(`[Cron] Sent 1-Hour Coach Reminder to ${session.CoachEmail} for Session ${session.SessionID}`);

                // 3. For each active session, find everyone enrolled in that specific class.
                const [users] = await connection.query(`
                    SELECT u.Email, u.FirstName, u.LastName 
                    FROM enrollment e
                    JOIN useraccount u ON e.UserID = u.UserID
                    WHERE e.ClassID = ? AND e.Status = 'ENROLLED'
                `, [session.ClassID]);

                if (users.length > 0) {
                    for (const user of users) {
                        const userName = user.FirstName ? `${user.FirstName} ${user.LastName || ''}`.trim() : "Player";
                        
                        await emailService.sendClassSessionReminder({
                            toEmail: user.Email,
                            toName: userName,
                            className: session.ClassName,
                            sportName: session.SportName,
                            startTime: formattedStartTime,
                            endTime: formattedEndTime,
                        });
                        console.log(`[Cron] Sent 1-Hour Class Reminder to ${user.Email} for Session ${session.SessionID}`);
                    }
                }

                // 4. Mark the Session's reminders as fundamentally sent
                await connection.query("UPDATE classsession SET ReminderSent = 1 WHERE SessionID = ?", [session.SessionID]);
            }
        }
    } catch (err) {
        console.error("[Cron] Error processing class session reminders:", err.message);
    } finally {
        if (connection) connection.release();
    }
};

async function processBookingExpirations() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.query(
            `UPDATE booking 
             SET Status = 'EXPIRED' 
             WHERE Status = 'PENDING_PAYMENT' 
             AND CreatedAt < NOW() - INTERVAL 10 MINUTE`
        );
        if (result.affectedRows > 0) {
            console.log(`[Cron] Expired ${result.affectedRows} unpaid bookings.`);
        }
    } catch (err) {
        console.error("[Cron] Error expiring bookings:", err.message);
    } finally {
        if (connection) connection.release();
    }
}

module.exports = { initCronJobs, processRecurringPayments, processBookingReminders, processClassSessionReminders, processBookingExpirations };
