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
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

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
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

  const subject = "Welcome to ArenaPro - Indoor Sports Complex";
  const safeName = typeof toName === "string" ? toName.trim() : "";
  const greetingName = safeName ? safeName : "Player";

  const text =
    `Welcome to ArenaPro, ${greetingName}!\n\n` +
    `Your account has been successfully created. You can now log in and start booking courts or join coaching classes.\n\n` +
    `We are excited to see you!\n\n` +
    `Best regards,\n` +
    `The ArenaPro Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #000;">Welcome to ArenaPro!</h2>
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
        <strong>The ArenaPro Team</strong>
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
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

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
    `The ArenaPro Team`;

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
        <strong>The ArenaPro Team</strong>
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

async function sendBookingOtpEmail({ toEmail, toName, otpCode }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Missing toEmail");
  }

  const transporter = getTransporter();

  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

  const subject = "Your Secure Booking OTP";
  const safeName = typeof toName === "string" ? toName.trim() : "";
  const greetingName = safeName ? safeName : "Player";

  const text =
    `Hello ${greetingName},\n\n` +
    `Your One-Time Password (OTP) for confirming your court booking is: ${otpCode}\n\n` +
    `This code will expire in 10 minutes.\n` +
    `If you did not request this, please ignore this email.\n\n` +
    `Best regards,\n` +
    `The ArenaPro Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #000;">Secure Booking Verification</h2>
      <p>Hi <strong>${greetingName}</strong>,</p>
      <p>Please use the following One-Time Password (OTP) to securely confirm your court booking. This adds an extra layer of security to your account.</p>
      
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <h1 style="font-family: monospace; letter-spacing: 4px; color: #000; margin: 0; font-size: 32px;">${otpCode}</h1>
      </div>
      
      <p style="color: #d32f2f; font-weight: bold;">This code is valid for 10 minutes.</p>
      <p style="color:#666; font-size: 14px;">If you did not initiate this booking, please ignore this email.</p>
      
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The ArenaPro Team</strong>
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

async function sendPaymentConfirmationEmail({ toEmail, toName, targetName, amount, isClass }) {
  if (!toEmail || typeof toEmail !== "string") throw new Error("Missing toEmail");

  const transporter = getTransporter();
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

  const typeStr = isClass ? "Coaching Class Enrollment" : "Court Booking";
  const subject = `Confirmed: Your ${typeStr}`;
  const safeName = typeof toName === "string" ? toName.trim() : "Player";

  const formattedAmount = Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  const text =
    `Hello ${safeName},\n\n` +
    `Great news! We have successfully received your payment of LKR ${formattedAmount} for your ${typeStr}.\n` +
    `Details:\n` +
    `- Type: ${typeStr}\n` +
    `- Item: ${targetName}\n` +
    `- Status: CONFIRMED\n\n` +
    `Your booking/enrollment is completely verified, and you are good to go! We look forward to seeing you at ArenaPro.\n\n` +
    `Best regards,\n` +
    `The ArenaPro Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #000;">Payment & Booking Confirmed!</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>Great news! We have successfully received your payment for your <strong>${typeStr}</strong>.</p>
      
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0;">Receipt Summary</h3>
        <p style="margin: 0 0 8px;"><strong>Item:</strong> ${targetName}</p>
        <p style="margin: 0 0 8px;"><strong>Amount Paid:</strong> LKR ${formattedAmount}</p>
        <p style="margin: 0; color: #10b981; font-weight: bold;">Status: CONFIRMED</p>
      </div>
      
      <p>Your spot is now officially reserved and verified. We look forward to seeing you soon!</p>
      
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The ArenaPro Team</strong>
      </p>
    </div>
  `;

  return await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: `"${safeName}" <${toEmail}>`,
    subject,
    text,
    html
  });
}

async function sendSlipPendingEmail({ toEmail, toName, targetName, amount, isClass }) {
  if (!toEmail || typeof toEmail !== "string") throw new Error("Missing toEmail");

  const transporter = getTransporter();
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

  const typeStr = isClass ? "Coaching Class Enrollment" : "Court Booking";
  const subject = `Pending Verification: Your ${typeStr}`;
  const safeName = typeof toName === "string" ? toName.trim() : "Player";

  const formattedAmount = Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  const text =
    `Hello ${safeName},\n\n` +
    `We have successfully received your bank slip upload for your ${typeStr} (LKR ${formattedAmount}).\n\n` +
    `Your spot has been temporarily held. Our administrative team will verify your payment slip shortly. Once verified, you will receive a final confirmation email.\n\n` +
    `Details:\n` +
    `- Type: ${typeStr}\n` +
    `- Item: ${targetName}\n` +
    `- Status: WAITING VERIFICATION\n\n` +
    `Best regards,\n` +
    `The ArenaPro Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #000;">Bank Slip Uploaded Successfully</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>We've successfully received your bank slip for your <strong>${typeStr}</strong>.</p>
      
      <div style="background-color: #fcf8e3; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f59e0b;">
        <h3 style="margin-top: 0; color: #8a6d3b;">Pending Verification</h3>
        <p style="margin: 0 0 8px;"><strong>Item:</strong> ${targetName}</p>
        <p style="margin: 0 0 8px;"><strong>Declared Amount:</strong> LKR ${formattedAmount}</p>
        <p style="margin: 0; color: #d97706; font-weight: bold;">Status: WAITING VERIFICATION</p>
      </div>
      
      <p>Your spot has been temporarily held for you! Our staff will manually review your deposit slip soon. Once verified, we will send you a definitive confirmation email.</p>
      
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The ArenaPro Team</strong>
      </p>
    </div>
  `;

  return await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: `"${safeName}" <${toEmail}>`,
    subject,
    text,
    html
  });
}

async function sendSessionCancelledEmail({ toEmail, toName, className, sessionDate, startTime, endTime }) {
  if (!toEmail || typeof toEmail !== "string") throw new Error("Missing toEmail");

  const transporter = getTransporter();
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

  const subject = `URGENT: Class Cancellation - ${className}`;
  const safeName = typeof toName === "string" ? toName.trim() : "Player";

  const text =
    `Hello ${safeName},\n\n` +
    `We are writing to urgently inform you that a session for your enrolled class '${className}' has been CANCELLED by the coach.\n\n` +
    `Cancelled Session Details:\n` +
    `- Date: ${sessionDate}\n` +
    `- Time: ${startTime} - ${endTime}\n\n` +
    `Please do not attend the complex for this specific timeslot.\n\n` +
    `Best regards,\n` +
    `The ArenaPro Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #d32f2f;">Class Session Cancelled</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>This is an urgent notification that a session for your enrolled class <strong>${className}</strong> has been cancelled by the coach.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ef4444;">
        <h3 style="margin-top: 0; color: #b91c1c;">Cancelled Session Details</h3>
        <p style="margin: 0 0 8px;"><strong>Date:</strong> ${sessionDate}</p>
        <p style="margin: 0 0 8px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p style="margin: 0; color: #dc2626; font-weight: bold;">Status: CANCELLED</p>
      </div>
      
      <p>Please do not attend the complex for this specific timeslot.</p>
      
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The ArenaPro Team</strong>
      </p>
    </div>
  `;

  return await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: `"${safeName}" <${toEmail}>`,
    subject,
    text,
    html
  });
}

async function sendCourtBookingReminder({ toEmail, toName, sportName, startTime, endTime }) {
  if (!toEmail || typeof toEmail !== "string") throw new Error("Missing toEmail");

  const transporter = getTransporter();
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

  const subject = `Reminder: Your ${sportName} booking starts in 1 Hour`;
  const safeName = typeof toName === "string" ? toName.trim() : "Player";

  const text =
    `Hello ${safeName},\n\n` +
    `This is a friendly 1-Hour reminder for your upcoming court booking!\n\n` +
    `Booking Details:\n` +
    `- Sport: ${sportName}\n` +
    `- Time: ${startTime} - ${endTime}\n\n` +
    `Please arrive safely and on time. We look forward to seeing you!\n\n` +
    `Best regards,\n` +
    `The ArenaPro Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #000;">Court Booking Reminder</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>This is a friendly reminder that your upcoming court booking starts in exactly <strong>1 hour</strong>.</p>
      
      <div style="background-color: #fafffa; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #3b82f6;">
        <h3 style="margin-top: 0; color: #1e3a8a;">Booking Details</h3>
        <p style="margin: 0 0 8px;"><strong>Sport:</strong> ${sportName}</p>
        <p style="margin: 0 0 8px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p style="margin: 0; color: #2563eb; font-weight: bold;">Status: CONFIRMED</p>
      </div>
      
      <p>Please make sure to arrive slightly early to get settled in. We are extremely excited to see you at the complex!</p>
      
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The ArenaPro Team</strong>
      </p>
    </div>
  `;

  return await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: `"${safeName}" <${toEmail}>`,
    subject,
    text,
    html
  });
}

async function sendClassSessionReminder({ toEmail, toName, className, sportName, startTime, endTime }) {
  if (!toEmail || typeof toEmail !== "string") throw new Error("Missing toEmail");

  const transporter = getTransporter();
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

  const subject = `Reminder: Your ${sportName} class starts in 1 Hour`;
  const safeName = typeof toName === "string" ? toName.trim() : "Player";

  const text =
    `Hello ${safeName},\n\n` +
    `This is a friendly 1-Hour reminder for your upcoming coaching class!\n\n` +
    `Session Details:\n` +
    `- Class: ${className}\n` +
    `- Sport: ${sportName}\n` +
    `- Time: ${startTime} - ${endTime}\n\n` +
    `Please arrive safely and on time for your session.\n\n` +
    `Best regards,\n` +
    `The ArenaPro Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #000;">Class Session Reminder</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>This is a friendly reminder that a session for your enrolled class starts in exactly <strong>1 hour</strong>.</p>
      
      <div style="background-color: #fafffa; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #8b5cf6;">
        <h3 style="margin-top: 0; color: #5b21b6;">Session Details</h3>
        <p style="margin: 0 0 8px;"><strong>Class:</strong> ${className}</p>
        <p style="margin: 0 0 8px;"><strong>Sport:</strong> ${sportName}</p>
        <p style="margin: 0 0 8px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p style="margin: 0; color: #7c3aed; font-weight: bold;">Status: SCHEDULED</p>
      </div>
      
      <p>Please make sure to arrive slightly early to get prepared for your class. We are extremely excited to see you!</p>
      
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The ArenaPro Team</strong>
      </p>
    </div>
  `;

  return await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: `"${safeName}" <${toEmail}>`,
    subject,
    text,
    html
  });
}

async function sendCoachClassSessionReminder({ toEmail, toName, className, sportName, startTime, endTime }) {
  if (!toEmail || typeof toEmail !== "string") throw new Error("Missing toEmail");

  const transporter = getTransporter();
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

  const subject = `Urgent Reminder: Conducting your ${sportName} class in 1 Hour`;
  const safeName = typeof toName === "string" ? toName.trim() : "Coach";

  const text =
    `Hello ${safeName},\n\n` +
    `This is a friendly reminder that you have a coaching session to conduct in exactly 1 hour.\n\n` +
    `Session Details:\n` +
    `- Class: ${className}\n` +
    `- Sport: ${sportName}\n` +
    `- Time: ${startTime} - ${endTime}\n\n` +
    `Please ensure you are at the complex on time to welcome your students.\n\n` +
    `Best regards,\n` +
    `The ArenaPro Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #000;">Coach Session Reminder</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>This is a reminder that you are scheduled to conduct a coaching session in exactly <strong>1 hour</strong>.</p>
      
      <div style="background-color: #fffaf0; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f6ad55;">
        <h3 style="margin-top: 0; color: #7b341e;">Class Details</h3>
        <p style="margin: 0 0 8px;"><strong>Class:</strong> ${className}</p>
        <p style="margin: 0 0 8px;"><strong>Sport:</strong> ${sportName}</p>
        <p style="margin: 0 0 8px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
      </div>
      
      <p>Please ensure all equipment is ready and you are at the designated court on time. Your students are looking forward to the session!</p>
      
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The ArenaPro Team</strong>
      </p>
    </div>
  `;

  return await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: `"${safeName}" <${toEmail}>`,
    subject,
    text,
    html
  });
}

async function sendPaymentRejectionEmail({ toEmail, toName, targetName, amount, isClass }) {
  if (!toEmail || typeof toEmail !== "string") throw new Error("Missing toEmail");

  const transporter = getTransporter();
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@example.com";
  const fromName = process.env.BREVO_FROM_NAME || "ArenaPro";

  const typeStr = isClass ? "Coaching Class Enrollment" : "Court Booking";
  const subject = `Update: Your Payment for ${targetName}`;
  const safeName = typeof toName === "string" ? toName.trim() : "Player";

  const formattedAmount = Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2 });

  const text =
    `Hello ${safeName},\n\n` +
    `We are writing to inform you that your payment for ${targetName} (LKR ${formattedAmount}) could not be verified and has been REJECTED by our administration.\n\n` +
    (isClass 
      ? `This payment was for a Coaching Class installment. Your enrollment remains active, but the payment is still marked as DUE. Please upload a valid payment slip as soon as possible to avoid losing your spot.\n\n` 
      : `Because this payment was for a Court Booking, your reservation has been automatically CANCELLED and the court time has been released. If you still wish to play, please create a new booking.\n\n`) +
    `Common reasons for rejection include blurry slip images, incorrect amounts, or missing transaction details.\n\n` +
    `Best regards,\n` +
    `The ArenaPro Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin: 0 0 16px; color: #d32f2f;">Payment Verification Update</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>We are writing to inform you that we could not verify your payment slip for <strong>${targetName}</strong>.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #dc2626;">
        <h3 style="margin-top: 0; color: #b91c1c;">Payment Rejected</h3>
        <p style="margin: 0 0 8px;"><strong>Item:</strong> ${targetName}</p>
        <p style="margin: 0 0 8px;"><strong>Amount:</strong> LKR ${formattedAmount}</p>
        <p style="margin: 0; color: #dc2626; font-weight: bold;">Status: REJECTED</p>
      </div>
      
      <p>
        ${isClass 
          ? "This installment is still marked as <strong>DUE</strong>. Please log in and upload a valid payment slip to maintain your enrollment standing." 
          : "Because this was for a court booking, your reservation has been <strong>CANCELLED</strong> and the slot has been released for other players."}
      </p>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        Common rejection reasons: Blurry images, incorrect payment amount, or invalid transaction reference.
      </p>
      
      <p style="margin-top: 32px; color:#888; font-size: 14px;">
        Best regards,<br>
        <strong>The ArenaPro Team</strong>
      </p>
    </div>
  `;

  return await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: `"${safeName}" <${toEmail}>`,
    subject,
    text,
    html
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountCreatedEmail,
  sendBookingOtpEmail,
  sendPaymentConfirmationEmail,
  sendSlipPendingEmail,
  sendSessionCancelledEmail,
  sendCourtBookingReminder,
  sendClassSessionReminder,
  sendCoachClassSessionReminder,
  sendPaymentRejectionEmail
};
