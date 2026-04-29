const express = require('express');
const multer = require('multer');

const app = express();
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/test', upload.array('images', 5), (req, res) => {
  res.json({ body: req.body, files: req.files });
});

app.listen(3000, async () => {
  console.log('Server started');
  try {
    const r = await fetch('http://localhost:3000/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test', images: ['base64string'] })
    });
    const data = await r.json();
    console.log('Response:', data);
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
});
