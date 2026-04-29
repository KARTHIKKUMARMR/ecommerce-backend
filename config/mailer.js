/**
 * mailer.js — Email Configuration using Nodemailer
 *
 * HOW IT WORKS:
 * - Nodemailer is a Node.js library that sends emails.
 * - We create a "transporter" — think of it as the email client.
 * - It uses Gmail SMTP with your credentials (stored safely in .env).
 * - We export a `sendMail` helper function that any route can use.
 *
 * SETUP REQUIRED:
 * 1. In .env, add: EMAIL_USER=yourgmail@gmail.com
 * 2. In .env, add: EMAIL_PASS=your_16char_app_password
 * 3. In Google Account → Security → App Passwords → generate one for "Mail"
 */

const nodemailer = require('nodemailer');

// Create the transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // Your Gmail address from .env
    pass: process.env.EMAIL_PASS,   // Your Gmail App Password from .env
  },
});

/**
 * sendMail — sends an email
 * @param {string} to       - Recipient email address
 * @param {string} subject  - Email subject line
 * @param {string} html     - HTML body of the email
 */
const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `HASHTHAKALA <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

/**
 * sendOTPEmail — sends a formatted OTP verification email
 * @param {string} to   - Recipient email
 * @param {string} otp  - The 6-digit OTP code
 * @param {string} name - Recipient's name
 */
const sendOTPEmail = async (to, otp, name) => {
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
        <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #c9a84c;">${otp}</div>
        <p style="color: #6b5030; font-size: 12px; margin: 12px 0 0;">This code expires in <strong style="color:#c9a84c;">10 minutes</strong></p>
      </div>

      <p style="color: #6b5030; font-size: 13px; border-top: 1px solid #3a2020; padding-top: 20px;">
        If you did not request this, please ignore this email. Do not share this code with anyone.
      </p>
    </div>
  `;

  await sendMail(to, 'Verify your HASHTHAKALA account — OTP Code', html);
};

module.exports = { sendMail, sendOTPEmail };
