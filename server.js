const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));

app.get('/formats', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).send('Missing videoId');

  try {
    const info = await ytdl.getInfo(videoId);
    const formats = info.formats
      .filter(f =>
        f.hasVideo && f.hasAudio &&
        (f.container === 'mp4' || f.container === 'webm') &&
        f.qualityLabel && f.url
      )
      .map(f => ({
        itag: f.itag,
        quality: f.qualityLabel,
        container: f.container,
        mimeType: f.mimeType
      }));

    res.json(formats);
  } catch (err) {
    console.error('フォーマット取得エラー:', err.message);
    res.status(500).send('フォーマット取得に失敗');
  }
});

app.get('/stream', async (req, res) => {
  const { videoId, itag } = req.query;
  if (!videoId || !itag) return res.status(400).send('Missing parameters');
  try {
    const stream = ytdl(videoId, {
      quality: itag,
      filter: 'audioandvideo',
      highWaterMark: 1 << 25,
    });
    res.setHeader('Content-Type', 'video/mp4');
    stream.pipe(res);
  } catch (err) {
    console.error('ストリームエラー:', err.message);
    res.status(500).send('動画のストリーミングに失敗しました');
  }
});

app.listen(port, () => {
  console.log(`✅ YouTube Stream Server running: http://localhost:${port}`);
});
