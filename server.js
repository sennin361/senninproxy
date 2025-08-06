const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// 静的ファイル配信（public ディレクトリに HTML/CSS/JS を置く）
app.use(express.static(path.join(__dirname, 'public')));

// ルートアクセスに対するレスポンス（任意）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🎯 ストリームURLを返すエンドポイント
app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).send('Missing videoId');

  try {
    const info = await ytdl.getInfo(videoId);

    // 高品質 or 中品質を選択
    const format = ytdl.chooseFormat(info.formats, {
      quality: '18', // 18 = MP4 360p with audio
      filter: 'audioandvideo'
    });

    if (!format || !format.url) {
      return res.status(404).send('Stream URL not found');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(format.url); // プレイヤーに返す
  } catch (error) {
    console.error('Error fetching stream URL:', error);
    res.status(500).send('Error retrieving video stream');
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
