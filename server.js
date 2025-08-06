const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORSを有効化
app.use(cors());

// 静的ファイルを配信 (例: index.html, watch.html, style.css, script.jsなど)
app.use(express.static(path.join(__dirname, 'public')));

// "/" にアクセスされたら index.html を返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🎯 YouTube動画をストリーム形式でプロキシ再生
app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) {
    return res.status(400).send('videoId が指定されていません');
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    // 適切なフォーマットを取得（映像 + 音声, mp4, 非ライブ）
    const format = ytdl.chooseFormat(info.formats, {
      quality: '18', // mp4 360p (音声付き)
      filter: (format) =>
        format.container === 'mp4' &&
        format.hasVideo &&
        format.hasAudio &&
        !format.live
    });

    if (!format || !format.url) {
      return res.status(404).send('適切な動画形式が見つかりません');
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // ytdl をストリームとしてクライアントに流す
    ytdl(url, { format }).pipe(res);

  } catch (err) {
    console.error('ストリームエラー:', err.message);
    res.status(500).send('動画の取得中にエラーが発生しました');
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ YouTube Stream Proxy Server is running on port ${PORT}`);
});
