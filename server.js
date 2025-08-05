const express = require('express');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイルを提供（index.html など）
app.use(express.static(path.join(__dirname, 'public')));

// Chromium のパスを環境変数から取得
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/chromium-browser';

// ルートにアクセスされたとき、ストリーミング画像を生成して表示
app.get('/screenshot', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://example.com'); // スクリーンショットしたいURL

    const screenshotBuffer = await page.screenshot({ type: 'jpeg' });

    await browser.close();

    res.set('Content-Type', 'image/jpeg');
    res.send(screenshotBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating screenshot');
  }
});

// index.htmlがなければ「Cannot GET /」になるので対応
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('<h1>Welcome</h1><p>index.html がありません</p>');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
