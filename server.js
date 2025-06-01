const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('http')) {
    return res.status(400).send('URLが正しくありません');
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const html = await page.content();
    res.send(html);
    await browser.close();
  } catch (error) {
    res.status(500).send('取得に失敗しました: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`仙人Proxyサーバー起動: http://localhost:${PORT}`);
});
