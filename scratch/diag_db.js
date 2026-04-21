require('dotenv').config({ path: './backend/.env' });
const { pool } = require('../backend/src/config/db');

async function check() {
    try {
        const [sports] = await pool.query("SELECT * FROM sport");
        const [courts] = await pool.query("SELECT * FROM court");
        const [courtSports] = await pool.query("SELECT * FROM court_sport");
        const [classes] = await pool.query(`
            SELECT c.ClassID, c.Title, sch.ScheduleType, sch.StartTime, sch.EndTime, 
                   GROUP_CONCAT(DISTINCT csd.Weekday) as weekdays
            FROM class c
            JOIN classschedule sch ON c.ClassID = sch.ClassID
            LEFT JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
            WHERE c.Title LIKE 'Badminton Beginners%'
            GROUP BY c.ClassID
        `);
        console.log(JSON.stringify({ sports, courts, courtSports, classes }, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
