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
    tls: { servername: host }
  });
}

function isValidHttpUrl(url) {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function sendPasswordResetEmail({ toEmail, toName, resetLink }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Missing toEmail");
  }
  if (!resetLink || !isValidHttpUrl(resetLink)) {
    throw new Error("Invalid reset link");
  }

  const transporter = getTransporter();

  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "Indoor Sports Complex";

  const subject = "Reset your password";
  const text =
    `You requested a password reset. Use this link to reset your password:\n\n${resetLink}\n\n` +
    `If you did not request this, you can ignore this email.`;

  const safeName = typeof toName === "string" ? toName.trim() : "";

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
    to: safeName ? `"${safeName}" <${toEmail}>` : toEmail,
    subject,
    text,
    html
  });

  return info;
}

async function sendWelcomeEmail({ toEmail, toName }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Missing toEmail");
  }

  const transporter = getTransporter();

  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "Indoor Sports Complex";

  const subject = "Welcome to Indoor Sports Complex!";
  const safeName = typeof toName === "string" ? toName.trim() : "";
  const greetingName = safeName ? safeName : "Player";

  const text =
    `Welcome to Indoor Sports Complex, ${greetingName}!\n\n` +
    `Your account has been successfully created. You can now log in and start booking courts or join coaching classes.\n\n` +
    `We are excited to see you!\n\n` +
    `Best regards,\n` +
    `The Indoor Sports Complex Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #000;">Welcome to Indoor Sports Complex!</h2>
      <p>Hi <strong>${greetingName}</strong>,</p>
      <p>Your account has been successfully created. We are thrilled to have you onboard.</p>
      <p>You can now log in to your account and start booking courts or enrolling in your favorite coaching classes.</p>
      <p style="margin: 24px 0;">
        <a href="${process.env.FRONTEND_BASE_URL || "http://localhost:5173"}/login" style="background:#000;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;font-weight:bold;">
          Log in Now
        </a>
      </p>
      <p style="color:#555;">We are excited to see you at the complex!</p>
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The Indoor Sports Complex Team</strong>
      </p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: safeName ? `"${safeName}" <${toEmail}>` : toEmail,
    subject,
    text,
    html
  });

  return info;
}

async function sendAccountCreatedEmail({ toEmail, toName, role, tempPassword }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Missing toEmail");
  }

  const transporter = getTransporter();

  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "Indoor Sports Complex";

  const subject = "Your new account has been created";
  const safeName = typeof toName === "string" ? toName.trim() : "";
  const greetingName = safeName ? safeName : "User";

  const text =
    `Hello ${greetingName},\n\n` +
    `An administrator has created a new account for you as a ${role.replace("_", " ")}.\n\n` +
    `Email: ${toEmail}\n` +
    `Temporary Password: ${tempPassword}\n\n` +
    `Please log in and change your password immediately.\n\n` +
    `Best regards,\n` +
    `The Indoor Sports Complex Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #000;">Your Account Setup is Complete</h2>
      <p>Hi <strong>${greetingName}</strong>,</p>
      <p>An administrator has created a new account for you on the platform with the role: <strong>${role.replace("_", " ")}</strong>.</p>
      <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${toEmail}</p>
        <p style="margin: 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</span></p>
      </div>
      <p>For your security, please log in and change your temporary password immediately.</p>
      <p style="margin: 24px 0;">
        <a href="${process.env.FRONTEND_BASE_URL || "http://localhost:5173"}/login" style="background:#000;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;font-weight:bold;">
          Log in & Change Password
        </a>
      </p>
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The Indoor Sports Complex Team</strong>
      </p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: safeName ? `"${safeName}" <${toEmail}>` : toEmail,
    subject,
    text,
    html
  });

  return info;
}

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountCreatedEmail
};
