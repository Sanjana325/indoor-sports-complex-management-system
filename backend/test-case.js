const { pool } = require("./src/config/db");

async function test() {
  try {
    const [rows] = await pool.query("SELECT UserID as 'CaseTest', UserID FROM UserAccount LIMIT 1");
    if (rows.length > 0) {
      console.log("KEYS:", Object.keys(rows[0]));
      console.log("CASE TEST:", rows[0].CaseTest);
      console.log("USERID (Pascal):", rows[0].UserID);
      console.log("userid (lower):", rows[0].userid);
      console.log("userId (camel):", rows[0].userId);
    } else {
      console.log("No users found.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
test();
