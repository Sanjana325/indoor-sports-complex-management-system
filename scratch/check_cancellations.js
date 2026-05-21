const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCancellations() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await connection.execute(`
            SELECT cs.SessionID, c.Title, cs.SessionDate, cs.Status, co.CoachID, u.FirstName
            FROM classsession cs
            JOIN class c ON cs.ClassID = c.ClassID
            JOIN coach co ON c.CoachID = co.CoachID
            JOIN useraccount u ON co.UserID = u.UserID
            WHERE cs.Status = 'CANCELLED'
            ORDER BY cs.SessionDate DESC
        `);

        console.log('Cancelled Sessions:', JSON.stringify(rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkCancellations();
