/**
 * mailer.js — Email via Brevo (formerly Sendinblue) SMTP Relay
 *
 * WHY NOT GMAIL?
 * Render (and most cloud servers on AWS) cannot connect to Gmail's SMTP servers.
 * Gmail SMTP is blocked at the network level from cloud IPs to prevent spam.
 * This causes "Connection timeout" errors that have nothing to do with credentials.
 *
 * WHY BREVO?
 * Brevo is a dedicated email delivery service. It works perfectly from Render.
 * Free tier: 300 emails/day, 9000/month. No credit card required.
 * Their SMTP relay (smtp-relay.brevo.com) is not blocked by cloud providers.
 *
 * .env variables needed:
 *   BREVO_USER = srihasthikala@gmail.com   (your Brevo account email)
 *   BREVO_PASS = xsmtpsib-xxxx...          (Brevo SMTP key from Settings page)
 *
 * HOW TO GET BREVO CREDENTIALS:
 *   1. Sign up free at https://app.brevo.com  (use srihasthikala@gmail.com)
 *   2. Go to: Account (top right) → SMTP & API
 *   3. Under "SMTP" tab → click "Generate a new SMTP key"
 *   4. Copy the key → paste as BREVO_PASS in .env and Render dashboard
 */

const nodemailer = require('nodemailer');

// Check if Brevo SMTP credentials are configured
const isEmailConfigured = () => {
  const user = process.env.BREVO_USER || process.env.EMAIL_USER;
  const pass = process.env.BREVO_PASS || process.env.EMAIL_PASS;
  return (
    !!user &&
    !!pass &&
    user.includes('@') &&
    pass !== 'your_16char_app_password' &&
    pass !== 'REPLACE_WITH_APP_PASSWORD' &&
    pass !== 'REPLACE_WITH_BREVO_SMTP_KEY'
  );
};

// Get the sender email
const getSenderEmail = () => process.env.BREVO_USER || process.env.EMAIL_USER || 'noreply@hashthakala.com';

// Create Brevo SMTP transporter
// Brevo SMTP relay works from ALL cloud servers including Render/AWS
const createBrevoTransporter = () => {
  return nodemailer.createTransport({
    host:   'smtp-relay.brevo.com',  // Brevo's SMTP relay server
    port:   587,                      // Standard SMTP port (not blocked by cloud providers)
    secure: false,                    // false for port 587 (STARTTLS)
    auth: {
      user: process.env.BREVO_USER || process.env.EMAIL_USER,
      pass: process.env.BREVO_PASS || process.env.EMAIL_PASS,
    },
  });
};

// Dev fallback — Ethereal test inbox (no real emails, no setup needed)
const createDevTransporter = async () => {
  console.warn('⚠️  Email not configured. Using Ethereal test inbox (dev fallback).');
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
 * @param {string} otp   — 6-digit OTP (raw, not hashed)
 * @param {string} name  — User's name for personalization
 * @returns {string|null} — Ethereal preview URL (dev only) or null
 */
const sendOTPEmail = async (to, otp, name) => {
  let transporter;
  let isDevMode = false;

  if (isEmailConfigured()) {
    transporter = createBrevoTransporter();
    console.log(`📧 Sending OTP via Brevo → FROM: ${getSenderEmail()} → TO: ${to}`);
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
    from:    `"HASHTHAKALA" <${getSenderEmail()}>`,
    to,
    subject: `${otp} is your HASHTHAKALA verification code`,
    html,
    text: `Hello ${name},\n\nYour HASHTHAKALA verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share this with anyone.\n\n— HASHTHAKALA Heritage Fashion`,
  });

  if (isDevMode) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('📬 Ethereal preview:', previewUrl);
    return previewUrl;
  }

  console.log(`✅ OTP email delivered to: ${to}`);
  return null;
};

module.exports = { sendOTPEmail, isEmailConfigured };
