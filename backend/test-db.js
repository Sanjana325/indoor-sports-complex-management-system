const { pool } = require("./src/config/db");
const userModel = require("./src/models/user.model");

async function test() {
  try {
    const [rows] = await pool.query("SELECT * FROM UserAccount LIMIT 1");
    if (rows.length > 0) {
      console.log("DB RAW ROW KEYS:", Object.keys(rows[0]));
      console.log("DB RAW ROW:", rows[0]);
      
      const user = await userModel.findById(rows[0].UserID || rows[0].userId);
      console.log("MODEL findById KEYS:", Object.keys(user));
    } else {
      console.log("No users found in database.");
    }
  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    process.exit();
  }
}

test();
