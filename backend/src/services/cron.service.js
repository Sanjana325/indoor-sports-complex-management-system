const cron = require("node-cron");
const { pool } = require("../config/db");

// initialize all scheduled tasks
const initCronJobs = () => {
    // daily billing check at midnight
    cron.schedule("0 0 * * *", async () => {
        console.log("[Cron] Running 28-day cycle billing check...");
        await processRecurringPayments();
    });

    // check for expired bookings every minute
    cron.schedule("* * * * *", async () => {
        console.log("[Cron] Running booking expiration check...");
        await processBookingExpirations();
    });

    // send reminders every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        console.log("[Cron] Running 1-hour booking & class session reminder checks...");
        await processBookingReminders();
        await processClassSessionReminders();
    });
};

// handle automatic billing and overdue checks
const processRecurringPayments = async () => {
    let connection;
    try {
        // start database transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // find enrollments that need a new 4-week billing cycle
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
            // check for existing billing record to avoid duplicates
            const [existing] = await connection.query(
                "SELECT 1 FROM enrollmentmonth WHERE EnrollmentID = ? AND PeriodMonth > ?",
                [item.EnrollmentID, item.PeriodMonth]
            );

            if (existing.length === 0) {
                // calculate next billing date
                const nextDate = new Date(item.PeriodMonth);
                nextDate.setDate(nextDate.getDate() + 28);
                const nextDateStr = nextDate.toISOString().split('T')[0];

                // create new billing record
                await connection.query(
                    "INSERT INTO enrollmentmonth (EnrollmentID, PeriodMonth, FeeAmount, Status) VALUES (?, ?, ?, 'DUE')",
                    [item.EnrollmentID, nextDateStr, item.Fee]
                );
                console.log(`[Cron] Generated new DUE cycle for Enrollment ${item.EnrollmentID} starting ${nextDateStr}`);
            }
        }

        // mark unpaid bills as overdue after 3 days
        const [result] = await connection.query(`
            UPDATE enrollmentmonth 
            SET Status = 'OVERDUE' 
            WHERE Status = 'DUE' 
              AND CreatedAt < NOW() - INTERVAL 3 DAY
        `);

        if (result.affectedRows > 0) {
            console.log(`[Cron] Marked ${result.affectedRows} payments as OVERDUE.`);
        }

        // commit database changes
        await connection.commit();
    } catch (err) {
        // rollback on error
        if (connection) await connection.rollback();
        console.error("[Cron] Error processing recurring payments:", err.message);
    } finally {
        // release connection
        if (connection) connection.release();
    }
};

// send reminder emails for upcoming court bookings
const processBookingReminders = async () => {
    let connection;
    try {
        connection = await pool.getConnection();

        // find bookings starting in the next hour
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
                // format times for email
                const startTime = new Date(item.StartDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const endTime = new Date(item.EndDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const userName = item.FirstName ? `${item.FirstName} ${item.LastName || ''}`.trim() : "Player";

                // send reminder email
                await emailService.sendCourtBookingReminder({
                    toEmail: item.Email,
                    toName: userName,
                    sportName: item.SportName,
                    startTime: startTime,
                    endTime: endTime
                });

                // mark reminder as sent in database
                await connection.query("UPDATE booking SET ReminderSent = 1 WHERE BookingID = ?", [item.BookingID]);
                console.log(`[Cron] Sent 1-Hour Reminder to ${item.Email} for Booking ${item.BookingID}`);
            }
        }
    } catch (err) {
        console.error("[Cron] Error processing booking reminders:", err.message);
    } finally {
        // release connection
        if (connection) connection.release();
    }
};

// send reminder emails for upcoming class sessions
const processClassSessionReminders = async () => {
    let connection;
    try {
        connection = await pool.getConnection();

        // find class sessions starting in the next hour
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
                // format times for email
                const formattedStartTime = new Date(`1970-01-01T${session.StartTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const formattedEndTime = new Date(`1970-01-01T${session.EndTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                // notify the coach of the session
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

                // find all students enrolled in the class
                const [users] = await connection.query(`
                    SELECT u.Email, u.FirstName, u.LastName 
                    FROM enrollment e
                    JOIN useraccount u ON e.UserID = u.UserID
                    WHERE e.ClassID = ? AND e.Status = 'ENROLLED'
                `, [session.ClassID]);

                if (users.length > 0) {
                    for (const user of users) {
                        const userName = user.FirstName ? `${user.FirstName} ${user.LastName || ''}`.trim() : "Player";
                        
                        // notify each student of the session
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

                // mark session reminder as sent
                await connection.query("UPDATE classsession SET ReminderSent = 1 WHERE SessionID = ?", [session.SessionID]);
            }
        }
    } catch (err) {
        console.error("[Cron] Error processing class session reminders:", err.message);
    } finally {
        // release connection
        if (connection) connection.release();
    }
};

// cancel bookings that haven't been paid in time
async function processBookingExpirations() {
    let connection;
    try {
        connection = await pool.getConnection();
        // expire unpaid bookings after 10 minutes
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
        // release connection
        if (connection) connection.release();
    }
}

module.exports = { initCronJobs, processRecurringPayments, processBookingReminders, processClassSessionReminders, processBookingExpirations };

