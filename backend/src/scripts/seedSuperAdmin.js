require("dotenv").config();
const { pool } = require("../config/db");
const { hashPassword } = require("../utils/password");

async function run() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const [exists] = await pool.query("SELECT 1 FROM UserAccount WHERE Email = ? LIMIT 1", [email]);
  if (exists.length) {
    console.log("SUPER_ADMIN already exists:", email);
    process.exit(0);
  }

  await pool.query(
    `INSERT INTO UserAccount 
      (FirstName, LastName, Email, PasswordHash, PhoneNumber, Role, MustChangePassword, IsActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["Super", "Admin", email, passwordHash, "0700000000", "SUPER_ADMIN", 0, 1]
  );

  console.log("SUPER_ADMIN created:", email);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
