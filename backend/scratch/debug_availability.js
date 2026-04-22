const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function checkAvailability() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        const date = '2026-04-22';
        const [courts] = await connection.query("SELECT CourtID, CourtName FROM court WHERE CourtName LIKE '%Side wicket%'");
        if (courts.length === 0) {
            console.log('Court not found');
            return;
        }

        const courtId = courts[0].CourtID;
        console.log(`Checking Court: ${courts[0].CourtName} (ID: ${courtId}) for Date: ${date}\n`);

        const startOfDay = `${date} 00:00:00`;
        const endOfDay = `${date} 23:59:59`;

        console.log('--- BOOKINGS ---');
        const [bookings] = await connection.query(
            `SELECT BookingID, StartDateTime, EndDateTime, Status 
             FROM booking 
             WHERE CourtID = ? AND Status IN ('PENDING_PAYMENT', 'WAITING_VERIFICATION', 'CONFIRMED')
             AND (StartDateTime < ? AND EndDateTime > ?)`,
            [courtId, endOfDay, startOfDay]
        );
        console.table(bookings);

        console.log('\n--- BLOCKED SLOTS ---');
        const [blocked] = await connection.query(
            `SELECT BlockedSlotID, StartDateTime, EndDateTime, Reason
             FROM blockedslot
             WHERE CourtID = ?
             AND (StartDateTime < ? AND EndDateTime > ?)`,
            [courtId, endOfDay, startOfDay]
        );
        console.table(blocked);

        console.log('\n--- CLASSES ---');
        // Weekday for 2026-04-22 (Wednesday = 3)
        const dayOfWeek = 3; 

        const [classSlots] = await connection.query(
            `SELECT c.Title, sch.StartTime, sch.EndTime, sch.ScheduleType, sch.OneTimeDate, csd.Weekday
             FROM class c
             JOIN class_court cc ON c.ClassID = cc.ClassID
             JOIN classschedule sch ON c.ClassID = sch.ClassID
             LEFT JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
             WHERE cc.CourtID = ?
             AND c.Status = 'ACTIVE'
             AND c.StartDate <= ?
             AND (
                 (sch.ScheduleType = 'ONE_TIME' AND sch.OneTimeDate = ?)
                 OR
                 (sch.ScheduleType = 'WEEKLY' AND csd.Weekday = ?)
             )`,
            [courtId, date, date, dayOfWeek]
        );
        console.table(classSlots);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkAvailability();
