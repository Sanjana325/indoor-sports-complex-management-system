const nodemailer = require("nodemailer");

function getTransporter() {
  const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;

  if (!user || !pass) {
    throw new Error("Brevo SMTP credentials missing. Set BREVO_SMTP_USER and BREVO_SMTP_PASS in .env");
  }

  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,

    logger: true,
    debug: true,

    tls: {
      servername: host
    }
  });
}

async function sendPasswordResetEmail({ toEmail, toName, resetLink }) {
  const transporter = getTransporter();

  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "Indoor Sports Complex";

  const subject = "Reset your password";
  const text = `You requested a password reset. Use this link to reset your password:\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Reset your password</h2>
      <p>You requested a password reset. Click the button below to set a new password.</p>
      <p style="margin: 18px 0;">
        <a href="${resetLink}" style="background:#000;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;display:inline-block;">
          Reset Password
        </a>
      </p>
      <p>If the button does not work, copy and paste this link:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p style="color:#666;font-size: 12px;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toName ? `"${toName}" <${toEmail}>` : toEmail,
    subject,
    text,
    html
  });

  return info;
}

module.exports = {
  sendPasswordResetEmail
};
