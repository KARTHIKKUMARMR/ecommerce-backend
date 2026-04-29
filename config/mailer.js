/**
 * mailer.js — Email Configuration using Nodemailer (Gmail SMTP)
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────────────────────
 * EMAIL_USER = srihasthikala@gmail.com  ← the SENDER (fixed, never changes)
 * EMAIL_PASS = your app password        ← Gmail App Password (fixed)
 *
 * When any user registers on your website, the OTP is sent:
 *   FROM: srihasthikala@gmail.com
 *   TO:   whatever email the user typed during registration
 *
 * You NEVER need to change .env for different users.
 * ─────────────────────────────────────────────────────────────────
 */

const nodemailer = require('nodemailer');

// Returns true when real Gmail credentials are properly set
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

// Cache transporter — created once, reused for all emails
let _transporter = null;

const getTransporter = async () => {
  if (_transporter) return _transporter;

  if (isEmailConfigured()) {
    console.log('📧 Email: Using Gmail SMTP →', process.env.EMAIL_USER);
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // These settings help emails NOT go to spam
      pool: true,
      maxConnections: 5,
      rateDelta: 20000,
      rateLimit: 5,
    });
  } else {
    // Dev fallback — Ethereal test inbox (no real emails sent)
    console.warn('⚠️  Email: Gmail not configured. Using Ethereal test inbox.');
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  return _transporter;
};

/**
 * sendOTPEmail
 * Sends a branded OTP verification email.
 *
 * @param {string} to    — The registering user's email (whoever is signing up)
 * @param {string} otp   — The 6-digit OTP (raw, not hashed)
 * @param {string} name  — The user's name for personalization
 * @returns {string|null} — Ethereal preview URL (dev only) or null
 */
const sendOTPEmail = async (to, otp, name) => {
  const transporter = await getTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f0e8;font-family:Georgia,serif;">
  <div style="max-width:520px;margin:40px auto;background:#1a0a0a;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2a0a0a,#1a0a0a);padding:36px 40px;text-align:center;border-bottom:2px solid #c9a84c;">
      <h1 style="color:#c9a84c;font-size:26px;letter-spacing:4px;margin:0;font-weight:700;">⚜ HASHTHAKALA ⚜</h1>
      <p style="color:#8b6914;font-size:11px;margin:6px 0 0;letter-spacing:3px;text-transform:uppercase;">Heritage Fashion</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <p style="font-size:16px;color:#d4c4a0;margin:0 0 8px;">Hello <strong style="color:#e8d5a0;">${name}</strong>,</p>
      <p style="color:#9a8060;line-height:1.7;margin:0 0 28px;font-size:14px;">
        Thank you for registering with HASHTHAKALA. To complete your account setup,
        please use the verification code below.
      </p>

      <!-- OTP Box -->
      <div style="background:#2a1010;border:2px solid #c9a84c;border-radius:14px;padding:32px;text-align:center;margin:0 0 28px;">
        <p style="color:#8b7040;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">Your Verification Code</p>
        <div style="font-size:52px;font-weight:900;letter-spacing:16px;color:#c9a84c;font-family:Courier,monospace;line-height:1;">${otp}</div>
        <div style="margin:18px 0 0;display:inline-block;background:#c9a84c;border-radius:20px;padding:4px 16px;">
          <p style="color:#1a0a0a;font-size:11px;font-weight:700;margin:0;">Expires in 10 minutes</p>
        </div>
      </div>

      <p style="color:#6b5030;font-size:13px;line-height:1.6;margin:0;">
        If you did not create an account on HASHTHAKALA, please ignore this email.
        Do not share this code with anyone.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#0f0505;padding:20px 40px;text-align:center;border-top:1px solid #3a2020;">
      <p style="color:#5a4030;font-size:12px;margin:0;">
        © 2024 HASHTHAKALA Heritage Fashion · This is an automated email, do not reply.
      </p>
    </div>

  </div>
</body>
</html>
  `;

  const info = await transporter.sendMail({
    from:    `"HASHTHAKALA" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 Your HASHTHAKALA Verification Code',
    html,
    // Plain-text fallback (helps avoid spam filters)
    text: `Hello ${name},\n\nYour HASHTHAKALA verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\n— HASHTHAKALA Heritage Fashion`,
    // Headers that improve deliverability
    headers: {
      'X-Priority':           '1',
      'X-Mailer':             'Nodemailer',
      'X-Entity-Ref-ID':      Date.now().toString(),
    },
  });

  // Ethereal preview URL (only in dev/fallback mode)
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('\n📬 Ethereal preview URL:', previewUrl, '\n');
    return previewUrl;
  }

  console.log(`✅ OTP email sent to: ${to}`);
  return null;
};

module.exports = { sendOTPEmail, isEmailConfigured };
