const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './.env' });

/**
 * Emergency Password Reset Utility
 * Usage: node emergency_reset.js <email> <newPassword>
 */

const SALT_ROUNDS = 10;

async function resetPassword() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node emergency_reset.js <email> <newPassword>');
        process.exit(1);
    }

    const email = args[0].trim().toLowerCase();
    const newPassword = args[1];

    console.log(`Attempting to reset password for: ${email}...`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        // 1. Verify user exists
        const [users] = await connection.execute('SELECT UserID, FirstName, LastName FROM UserAccount WHERE Email = ? LIMIT 1', [email]);

        if (users.length === 0) {
            console.error(`Error: User with email "${email}" not found.`);
            process.exit(1);
        }

        const user = users[0];
        console.log(`User found: ${user.FirstName} ${user.LastName} (ID: ${user.UserID})`);

        // 2. Hash New Password
        console.log('Hashing new password...');
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // 3. Update Database
        await connection.execute(
            'UPDATE UserAccount SET PasswordHash = ?, MustChangePassword = 1 WHERE UserID = ?',
            [hashedPassword, user.UserID]
        );

        console.log('\nSUCCESS: Password has been reset.');
        console.log('The user will be required to change their password upon their next login.');

    } catch (err) {
        console.error('Database Error:', err.message);
    } finally {
        await connection.end();
        process.exit(0);
    }
}

resetPassword();
