/**
 * mailer.js — Email via Resend API
 *
 * WHY RESEND?
 * ─────────────────────────────────────────────────────────────
 * - Gmail SMTP: blocked by Render (AWS IP restriction)
 * - Brevo SMTP: requires phone verification for new accounts
 * - Resend: uses HTTPS API (not SMTP) → works 100% from Render
 *   Free tier: 3,000 emails/month, 100/day. No phone needed.
 * ─────────────────────────────────────────────────────────────
 *
 * SETUP (one time only):
 *  1. Go to https://resend.com → Sign up free
 *  2. Go to API Keys → Create API Key → copy it
 *  3. Add to .env:  RESEND_API_KEY=re_xxxxxxxxxxxx
 *  4. Add same to Render dashboard environment variables
 *
 * The FROM address is "onboarding@resend.dev" until you verify
 * your domain at resend.com/domains. Works perfectly without it.
 */

const { Resend } = require('resend');

// Returns true when Resend API key is configured
const isEmailConfigured = () => {
  const key = process.env.RESEND_API_KEY;
  return !!key && key !== 'REPLACE_WITH_RESEND_API_KEY' && key.startsWith('re_');
};

/**
 * sendOTPEmail
 * Sends OTP email via Resend API (HTTPS — works from all servers).
 *
 * @param {string} to    — Recipient email (whoever is registering)
 * @param {string} otp   — 6-digit OTP (raw)
 * @param {string} name  — User's name
 */
const sendOTPEmail = async (to, otp, name) => {
  if (!isEmailConfigured()) {
    // Dev fallback — log OTP to console (no email sent)
    console.log('━'.repeat(50));
    console.log('⚠️  RESEND not configured. DEV MODE.');
    console.log(`📧 OTP for ${to}: ${otp}`);
    console.log('   Add RESEND_API_KEY to .env to send real emails.');
    console.log('━'.repeat(50));
    return null;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  console.log(`📧 Sending OTP via Resend → TO: ${to}`);

  const { data, error } = await resend.emails.send({
    // Using Resend's shared domain for testing (works without domain verification)
    // Once you verify your domain at resend.com/domains, change this to your domain
    from: 'HASHTHAKALA <onboarding@resend.dev>',
    to:      [to],
    subject: `${otp} is your HASHTHAKALA verification code`,
    html: `
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
</html>`,
    text: `Hello ${name},\n\nYour HASHTHAKALA verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n— HASHTHAKALA Heritage Fashion`,
  });

  if (error) {
    console.error('❌ Resend error:', error);
    throw new Error(error.message || 'Email delivery failed');
  }

  console.log(`✅ OTP email delivered → ${to} (ID: ${data?.id})`);
  return null;
};

module.exports = { sendOTPEmail, isEmailConfigured };
