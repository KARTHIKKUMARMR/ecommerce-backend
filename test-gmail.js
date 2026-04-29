require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmail() {
  console.log('Testing Gmail SMTP on Port 587...');
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'srihasthikala@gmail.com',
      pass: 'otufvwtkyehnzzaa',
    },
  });

  try {
    let info = await transporter.sendMail({
      from: '"Test" <srihasthikala@gmail.com>',
      to: 'srihasthikala@gmail.com',
      subject: 'Hello from Render Gmail Test 587',
      text: 'This is a test to see if port 587 is open.',
    });
    console.log('SUCCESS:', info.messageId);
  } catch (err) {
    console.error('ERROR:', err.message);
  }

  console.log('\nTesting Gmail SMTP on Port 465...');
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
      user: 'srihasthikala@gmail.com',
      pass: 'otufvwtkyehnzzaa',
    },
  });

  try {
    let info2 = await transporter.sendMail({
      from: '"Test" <srihasthikala@gmail.com>',
      to: 'srihasthikala@gmail.com',
      subject: 'Hello from Render Gmail Test 465',
      text: 'This is a test to see if port 465 is open.',
    });
    console.log('SUCCESS:', info2.messageId);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testGmail();
