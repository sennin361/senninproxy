const express = require('express');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/video', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId || !ytdl.validateID(videoId)) {
    return res.status(400).send('Invalid video ID');
  }
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  let attempt = 0;
  const maxAttempts = 3;

  function startStream() {
    attempt++;
    const stream = ytdl(url, {
      quality: 'highest',
      highWaterMark: 1 << 25, // 約33MBバッファで負荷軽減
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          'Referer': 'https://www.youtube.com/',
        }
      }
    });

    stream.on('error', (err) => {
      console.error(`Stream error on attempt ${attempt}:`, err.message);
      stream.destroy();
      if (attempt < maxAttempts) {
        console.log('Retrying stream...');
        startStream();
      } else {
        if (!res.headersSent) {
          res.status(500).send('Failed to stream video after multiple attempts.');
        }
      }
    });

    // クライアントが切断したらストリームも中止
    req.on('close', () => {
      stream.destroy();
    });

    // 1回目ならヘッダーセット
    if (attempt === 1) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Cache-Control', 'no-cache');
    }

    stream.pipe(res, { end: true });
  }

  startStream();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
