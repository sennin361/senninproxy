const express = require('express');
const puppeteer = require('puppeteer-core');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/screenshot', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const screenshot = await page.screenshot({ encoding: 'base64' });
    await browser.close();
    res.send(screenshot);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error taking screenshot');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
