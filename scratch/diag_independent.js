const mysql = require('mysql2/promise');

async function debug() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: '25roots',
        database: 'indoor_sports_complex_db',
        port: 3306
    };

    const weekdays = [0, 1]; // Sun, Mon
    const startTime = '15:00';
    const endTime = '17:00';
    const excludeId = 18;

    try {
        const conn = await mysql.createConnection(config);
        console.log("--- DATABASE DIAGNOSTIC (Sun/Mon 15:00-17:00) ---");

        // 1. All Courts
        const [courts] = await conn.query("SELECT CourtID, CourtName FROM court");
        console.log("\nALL COURTS:");
        console.table(courts);

        // 2. Active Classes on those days/times
        const [classes] = await conn.query(`
            SELECT c.ClassID, c.Title, csd.Weekday, sch.StartTime, sch.EndTime, GROUP_CONCAT(cc.CourtID) as courts
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            JOIN class_court cc ON c.ClassID = cc.ClassID
            WHERE c.Status = 'ACTIVE'
              AND csd.Weekday IN (?)
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
            GROUP BY c.ClassID, csd.Weekday
        `, [weekdays, startTime, endTime]);

        console.log("\nACTIVE CLASS CONFLICTS:");
        console.table(classes);

        // 3. Blocked Slots
        const [blocked] = await conn.query(`
            SELECT * FROM blockedslot
            WHERE (DAYOFWEEK(StartDateTime) - 1) IN (?)
              AND TIME(StartDateTime) < TIME(?)
              AND TIME(EndDateTime) > TIME(?)
        `, [weekdays, endTime, startTime]);

        console.log("\nBLOCKED SLOTS:");
        console.table(blocked);

        await conn.end();
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

debug();
