/**
 * mailer.js — Email Configuration using Nodemailer
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────
 * MODE 1 — DEVELOPMENT (no Gmail setup needed):
 *   If EMAIL_USER is not set (or is the placeholder), we automatically
 *   create a FREE Ethereal test inbox. Nodemailer logs a preview URL
 *   to the console — open it to see the exact email that was sent.
 *   The OTP is also always printed to the console for quick testing.
 *
 * MODE 2 — PRODUCTION (Gmail SMTP):
 *   When EMAIL_USER and EMAIL_PASS are set in .env, emails are sent
 *   via Gmail SMTP to the real recipient inbox.
 *   Requirements:
 *     1. EMAIL_USER = your Gmail address
 *     2. EMAIL_PASS = 16-char App Password (NOT your normal Gmail password)
 *        Get it: Google Account → Security → 2-Step Verification → App Passwords
 * ─────────────────────────────────────────────────
 */

const nodemailer = require('nodemailer');

// Check if real Gmail credentials are configured
const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return (
    user &&
    pass &&
    user !== 'your_gmail@gmail.com' &&
    pass !== 'your_16char_app_password' &&
    user.includes('@')
  );
};

// Cache the transporter so we don't recreate it on every request
let _transporter = null;

/**
 * getTransporter — lazily creates the email transporter
 * Uses Gmail if configured, otherwise uses Ethereal (free test inbox)
 */
const getTransporter = async () => {
  if (_transporter) return _transporter;

  if (isEmailConfigured()) {
    // ── Production: Gmail SMTP ─────────────────────────────────────────
    console.log('📧 Email: Using Gmail SMTP →', process.env.EMAIL_USER);
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // ── Development: Ethereal (free test inbox, no setup needed) ────────
    console.log('⚠️  Email: Gmail not configured — using Ethereal test inbox');
    console.log('   (Emails won\'t reach real inboxes. Check console for preview URL.)');

    // Ethereal creates a temporary test email account automatically
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('   Ethereal account created:', testAccount.user);
  }

  return _transporter;
};

/**
 * sendOTPEmail — sends a formatted OTP verification email
 * @param {string} to   - Recipient email address
 * @param {string} otp  - The 6-digit OTP (RAW, not hashed)
 * @param {string} name - Recipient's name for personalization
 * @returns {string|null} - Preview URL (Ethereal only) or null (Gmail)
 */
const sendOTPEmail = async (to, otp, name) => {
  const transporter = await getTransporter();

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; background: #1a0a0a; color: #f5f0e8; padding: 40px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #c9a84c; font-size: 28px; letter-spacing: 3px; margin: 0;">⚜ HASHTHAKALA ⚜</h1>
        <p style="color: #8b6914; font-size: 13px; margin-top: 6px; letter-spacing: 2px;">HERITAGE FASHION</p>
      </div>

      <p style="font-size: 16px; color: #d4c4a0;">Hello <strong>${name}</strong>,</p>
      <p style="color: #a89070; line-height: 1.6;">
        Thank you for registering with HASHTHAKALA. Use the verification code below to complete your registration.
      </p>

      <div style="background: #2a1010; border: 2px solid #c9a84c; border-radius: 12px; padding: 28px; text-align: center; margin: 28px 0;">
        <p style="color: #8b7040; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px;">Your Verification Code</p>
        <div style="font-size: 48px; font-weight: 700; letter-spacing: 14px; color: #c9a84c; font-family: monospace;">${otp}</div>
        <p style="color: #6b5030; font-size: 12px; margin: 12px 0 0;">This code expires in <strong style="color:#c9a84c;">10 minutes</strong></p>
      </div>

      <p style="color: #6b5030; font-size: 13px; border-top: 1px solid #3a2020; padding-top: 20px;">
        If you did not request this, please ignore this email. Do not share this code with anyone.
      </p>
    </div>
  `;

  const info = await transporter.sendMail({
    from:    process.env.EMAIL_FROM || `HASHTHAKALA <${isEmailConfigured() ? process.env.EMAIL_USER : 'noreply@hashthakala.com'}>`,
    to,
    subject: '🔐 Verify your HASHTHAKALA account — OTP Code',
    html,
  });

  // For Ethereal: log the preview URL to the console
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('\n──────────────────────────────────────────────');
    console.log('📬 ETHEREAL EMAIL PREVIEW (dev mode):');
    console.log('   Open this URL to see the email:');
    console.log('  ', previewUrl);
    console.log('──────────────────────────────────────────────\n');
    return previewUrl; // returned so the API can include it in dev response
  }

  return null;
};

module.exports = { sendOTPEmail, isEmailConfigured };
