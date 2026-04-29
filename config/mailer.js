/**
 * mailer.js — Email via Vercel Frontend API
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────────────────
 * Render completely blocks Gmail SMTP (ports 465/587).
 * Vercel does NOT block it.
 *
 * So, instead of Render sending the email directly, Render
 * makes a simple HTTP POST request to your Vercel frontend's
 * serverless function (/api/send-email). 
 * 
 * Vercel then uses your Gmail App Password to actually send the email.
 * This completely bypasses the block, uses zero new accounts,
 * and allows sending to ANY customer!
 * ─────────────────────────────────────────────────────────────
 */

const nodemailer = require('nodemailer');

// Returns true since we no longer need the backend to hold credentials
// The credentials are now hardcoded in the frontend Vercel function for simplicity.
const isEmailConfigured = () => true;

/**
 * sendOTPEmail
 *
 * @param {string} to    — Recipient email
 * @param {string} otp   — 6-digit OTP
 * @param {string} name  — User's name
 * @param {string} origin — The URL of the frontend making the request
 */
const sendOTPEmail = async (to, otp, name, origin) => {
  // 1. If we are testing locally, we can just send it directly using Nodemailer!
  // Your home internet doesn't block Gmail.
  if (!origin || origin.includes('localhost') || process.env.NODE_ENV !== 'production') {
    console.log('💻 Local dev detected. Sending directly from backend...');
    
    // We use your known working App Password here for local testing
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'srihasthikala@gmail.com',
        pass: 'otufvwtkyehnzzaa',
      },
    });

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
      <p style="color:#d4c4a0;font-size:15px;margin:0 0 8px;">Hello <strong>${name || 'Customer'}</strong>,</p>
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
      </p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: '"HASHTHAKALA" <srihasthikala@gmail.com>',
      to,
      subject: `${otp} is your HASHTHAKALA verification code`,
      html,
    });
    console.log(`✅ Local OTP email delivered -> ${to}`);
    return null;
  }

  // 2. We are on RENDER PRODUCTION!
  // Render blocks Gmail. So we ask Vercel to send it.
  try {
    // Make sure we don't have trailing slashes
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const vercelApiUrl = \`\${baseUrl}/api/send-email\`;
    
    console.log(\`☁️ Production detected. Routing email request to Vercel: \${vercelApiUrl}\`);

    // We use standard Fetch API to call your Vercel frontend
    const response = await fetch(vercelApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        otp,
        name,
        secret: 'hashthakala_internal_secret_2024' // Security check matching the Vercel file
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Vercel API failed to send email');
    }

    console.log(\`✅ OTP email routed via Vercel successfully -> \${to}\`);
    return null;

  } catch (err) {
    console.error('❌ Failed to route email through Vercel:', err.message);
    throw new Error('Email routing failed. ' + err.message);
  }
};

module.exports = { sendOTPEmail, isEmailConfigured };
