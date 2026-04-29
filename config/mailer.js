/**
 * mailer.js — Email via Brevo REST API
 *
 * This uses Brevo's HTTP API instead of SMTP.
 * Why? 
 * 1. Bypasses Render's strict SMTP block (since it uses HTTP port 443).
 * 2. 300 free emails per day.
 * 3. Simple and fast.
 */

// We don't need nodemailer for the REST API
const isEmailConfigured = () => {
  return !!process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'REPLACE_WITH_BREVO_API_KEY';
};

/**
 * sendOTPEmail
 * @param {string} to    — Recipient email
 * @param {string} otp   — 6-digit OTP
 * @param {string} name  — User's name
 */
const sendOTPEmail = async (to, otp, name) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  BREVO_API_KEY not found in .env. Skipping email send. (DEV MODE)');
    console.log(`📧 OTP for ${to}: ${otp}`);
    return null;
  }

  const htmlContent = `
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

  console.log(`📧 Sending OTP via Brevo API to ${to}...`);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'HASHTHAKALA',
        email: 'srihasthikala@gmail.com'
      },
      to: [
        {
          email: to,
          name: name || 'Customer'
        }
      ],
      subject: `${otp} is your HASHTHAKALA verification code`,
      htmlContent: htmlContent
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Brevo API Error:', data);
    throw new Error(data.message || 'Brevo API failed to send email');
  }

  console.log(`✅ Brevo email delivered successfully -> ${to} (Message ID: ${data.messageId})`);
  return null;
};

/**
 * sendResetPasswordEmail
 * @param {string} to    — Recipient email
 * @param {string} url   — Password reset URL
 * @param {string} name  — User's name
 */
const sendResetPasswordEmail = async (to, url, name) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  BREVO_API_KEY not found in .env. Skipping email send. (DEV MODE)');
    console.log(`📧 Password reset URL for ${to}: ${url}`);
    return null;
  }

  const htmlContent = `
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
        You are receiving this email because you (or someone else) have requested the reset of a password. Please make a PUT request to:
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${url}" style="display:inline-block;background:#c9a84c;color:#1a0a0a;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;letter-spacing:1px;">Reset Password</a>
      </div>
      <p style="color:#6b5030;font-size:12px;line-height:1.6;">
        Or click the link below:<br/>
        <a href="${url}" style="color:#c9a84c;word-break:break-all;">${url}</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  console.log(`📧 Sending password reset email via Brevo API to ${to}...`);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'HASHTHAKALA',
        email: 'srihasthikala@gmail.com'
      },
      to: [
        {
          email: to,
          name: name || 'Customer'
        }
      ],
      subject: 'Password reset token',
      htmlContent: htmlContent
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Brevo API Error:', data);
    throw new Error(data.message || 'Brevo API failed to send email');
  }

  console.log(`✅ Brevo email delivered successfully -> ${to} (Message ID: ${data.messageId})`);
  return null;
};

module.exports = { sendOTPEmail, sendResetPasswordEmail, isEmailConfigured };
