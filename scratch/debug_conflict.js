require('dotenv').config({ path: './backend/.env' });
const { pool } = require('../backend/src/config/db');

async function debugConflict() {
    // PARAMETERS FROM USER SCREENSHOT
    const scheduleType = 'WEEKLY';
    const weekdays = [1, 0]; // Mon, Sun
    const startTime = '15:00';
    const endTime = '17:00';
    const excludeClassId = 18; // Assuming this is the class ID for Badminton Beginners
    const startDate = '2026-04-05';

    console.log("--- DEBUGGING CONFLICTS ---");
    console.log(`Checking: ${scheduleType} on Days: ${weekdays} at ${startTime}-${endTime} (Exclude: ${excludeClassId})`);

    try {
        // 1. Check existing WEEKLY classes
        const [rows1] = await pool.query(`
            SELECT c.ClassID, c.Title, cc.CourtID, csd.Weekday, sch.StartTime, sch.EndTime
            FROM class c
            JOIN class_court cc ON c.ClassID = cc.ClassID
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE'
              AND sch.ScheduleType = 'WEEKLY'
              AND csd.Weekday IN (?)
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [weekdays, startTime, endTime]);

        console.log("\nFound Potential Class Conflicts (before filtering excludeClassId):");
        console.table(rows1);

        const filteredRows1 = rows1.filter(r => r.ClassID != excludeClassId);
        console.log(`\nConflicts after excluding ClassID ${excludeClassId}:`, filteredRows1.length);
        if (filteredRows1.length > 0) console.table(filteredRows1);

        // 2. Check Blocked Slots
        const [blocked] = await pool.query(`
            SELECT * FROM blockedslot
            WHERE (DAYOFWEEK(StartDateTime) - 1) IN (?)
              AND DATE(StartDateTime) >= ?
              AND TIME(StartDateTime) < TIME(?)
              AND TIME(EndDateTime) > TIME(?)
        `, [weekdays, startDate, endTime, startTime]);

        console.log("\nFound Blocked Slot Conflicts:");
        console.table(blocked);

        // 3. Check Coach Conflicts
        const [coachRows] = await pool.query(`
            SELECT c.ClassID, c.Title, c.CoachID, csd.Weekday, sch.StartTime, sch.EndTime
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Status = 'ACTIVE'
              AND sch.ScheduleType = 'WEEKLY'
              AND csd.Weekday IN (?)
              AND TIME(?) < sch.EndTime
              AND TIME(?) > sch.StartTime
        `, [weekdays, startTime, endTime]);

        console.log("\nFound Coach Conflicts (Hiruni Peris ID 9?):");
        console.table(coachRows.filter(r => r.CoachID == 9 && r.ClassID != excludeClassId));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

debugConflict();
