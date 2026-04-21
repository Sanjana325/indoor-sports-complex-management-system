const { pool } = require("../src/config/db");

async function checkSchema() {
    try {
        console.log("--- TABLE: enrollment ---");
        const [enrCols] = await pool.query("DESCRIBE enrollment");
        console.table(enrCols);

        console.log("\n--- TABLE: class ---");
        const [classCols] = await pool.query("DESCRIBE class");
        console.table(classCols);

        console.log("\n--- Sample Enrollments ---");
        const [enrData] = await pool.query("SELECT * FROM enrollment LIMIT 5");
        console.table(enrData);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
