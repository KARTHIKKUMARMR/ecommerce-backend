/**
 * mailer.js — Email via Gmail SMTP (Port 465 / SSL)
 *
 * Uses Gmail SMTP with direct port 465 (SSL) instead of the 'gmail' shorthand.
 * Port 465 with SSL is more reliable from cloud servers like Render.
 *
 * .env needed (set ONCE, never changes per user):
 *   EMAIL_USER = srihasthikala@gmail.com
 *   EMAIL_PASS = otufvwtkyehnzzaa  (Gmail App Password)
 */

const nodemailer = require('nodemailer');

const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return (
    !!user &&
    !!pass &&
    user !== 'your_gmail@gmail.com' &&
    pass !== 'your_16char_app_password' &&
    pass !== 'REPLACE_WITH_APP_PASSWORD' &&
    user.includes('@')
  );
};

// Create Gmail transporter using direct SMTP settings (port 465 SSL)
// This is more reliable than service:'gmail' from cloud servers like Render
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   465,
    secure: true,        // true for port 465 (SSL), false for 587 (TLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,  // helps avoid TLS cert issues on some servers
    },
  });
};

// Ethereal fallback for dev mode (when Gmail not configured)
const createDevTransporter = async () => {
  console.warn('⚠️  Gmail not configured. Using Ethereal test inbox (dev mode).');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
};

/**
 * sendOTPEmail
 * Sends OTP verification email to any email address.
 *
 * @param {string} to    — Recipient email (whoever is registering on the website)
 * @param {string} otp   — The 6-digit OTP (raw number, not hashed)
 * @param {string} name  — Recipient's name
 * @returns {string|null} — Ethereal preview URL (dev only) or null
 */
const sendOTPEmail = async (to, otp, name) => {
  let transporter;
  let isDevMode = false;

  if (isEmailConfigured()) {
    transporter = createGmailTransporter();
    console.log(`📧 Sending OTP email FROM: ${process.env.EMAIL_USER} → TO: ${to}`);
  } else {
    transporter = await createDevTransporter();
    isDevMode = true;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#f4f0e8;font-family:Georgia,serif;">
  <div style="max-width:500px;margin:0 auto;background:#1a0a0a;border-radius:16px;overflow:hidden;">

    <div style="background:#2a1010;padding:32px 40px;text-align:center;border-bottom:2px solid #c9a84c;">
      <h1 style="color:#c9a84c;font-size:24px;letter-spacing:4px;margin:0;">⚜ HASHTHAKALA ⚜</h1>
      <p style="color:#8b6914;font-size:10px;margin:6px 0 0;letter-spacing:3px;">HERITAGE FASHION</p>
    </div>

    <div style="padding:36px 40px;">
      <p style="color:#d4c4a0;font-size:15px;margin:0 0 8px;">Hello <strong>${name}</strong>,</p>
      <p style="color:#9a8060;line-height:1.7;font-size:13px;margin:0 0 28px;">
        Your verification code for HASHTHAKALA account registration is below.
      </p>

      <div style="background:#2a1010;border:2px solid #c9a84c;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="color:#8b7040;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Verification Code</p>
        <div style="font-size:48px;font-weight:900;letter-spacing:14px;color:#c9a84c;font-family:Courier,monospace;">${otp}</div>
        <p style="color:#c9a84c;font-size:11px;margin:12px 0 0;">⏱ Valid for 10 minutes only</p>
      </div>

      <p style="color:#6b5030;font-size:12px;line-height:1.6;">
        If you didn't register on HASHTHAKALA, please ignore this email.
        Never share this code with anyone.
      </p>
    </div>

    <div style="background:#0f0505;padding:16px 40px;text-align:center;">
      <p style="color:#5a4030;font-size:11px;margin:0;">© HASHTHAKALA Heritage Fashion · Automated email, do not reply</p>
    </div>
  </div>
</body>
</html>`;

  const info = await transporter.sendMail({
    from:    `"HASHTHAKALA" <${process.env.EMAIL_USER || 'noreply@hashthakala.com'}>`,
    to,
    subject: `${otp} is your HASHTHAKALA verification code`,
    html,
    text: `Hello ${name},\n\nYour HASHTHAKALA verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.\n\n— HASHTHAKALA Heritage Fashion`,
  });

  if (isDevMode) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('📬 Ethereal preview:', previewUrl);
    return previewUrl;
  }

  console.log(`✅ OTP email delivered → ${to}`);
  return null;
};

module.exports = { sendOTPEmail, isEmailConfigured };
