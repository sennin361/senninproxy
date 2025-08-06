const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'watch.html'));
});

app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).send('videoId パラメータが必要です');

  try {
    const info = await ytdl.getInfo(videoId);

    const format = info.formats.find(f =>
      f.container === 'mp4' &&
      f.hasVideo && f.hasAudio &&
      f.codecs && f.codecs.includes('avc1') // H.264: スマホ互換性高い
    );

    if (!format) return res.status(404).send('動画形式が見つかりません');

    res.setHeader('Content-Type', 'video/mp4');

    const stream = ytdl.downloadFromInfo(info, { format });
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end('ストリーミングエラー');
    });

    stream.pipe(res);
  } catch (err) {
    console.error('Failed to stream video:', err.message);
    res.status(500).send('動画のストリーミングに失敗しました');
  }
});

app.listen(PORT, () => {
  console.log(`✅ YouTube Stream Proxy Server is running at http://localhost:${PORT}`);
});
