const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// ✅ publicフォルダの静的ファイルを配信
app.use(express.static(path.join(__dirname, 'public')));

// ✅ ルートアクセスは index.html を返す（オプション）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ YouTube動画のプロキシエンドポイント
app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).send('Missing videoId');

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    const format = ytdl.chooseFormat(info.formats, {
      quality: '18', // medium MP4
      filter: 'audioandvideo'
    });

    if (!format || !format.url) {
      return res.status(404).send('Stream URL not found');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.redirect(format.url); // 🔁 URLにリダイレクト
  } catch (e) {
    res.status(500).send('Error retrieving video');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
