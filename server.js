const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ ストリーミングプロキシエンドポイント
app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).send('Missing videoId');

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, {
      quality: '18', // medium quality MP4
      filter: 'audioandvideo'
    });

    if (!format) {
      return res.status(404).send('No valid format found');
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // ✅ YouTubeのストリームをクライアントに転送
    ytdl(videoId, {
      format,
      quality: '18'
    }).pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error streaming video');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
