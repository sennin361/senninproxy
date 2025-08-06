const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS許可
app.use(cors());

// 静的ファイル（HTML, CSS, JSなど）
app.use(express.static(path.join(__dirname, 'public')));

// 動画ストリームプロキシ
app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;

  if (!videoId) {
    return res.status(400).send('videoIdが指定されていません');
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    // 最適なフォーマットを選択（映像+音声）
    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highest',
      filter: (f) => f.container === 'mp4' && f.hasAudio && f.hasVideo,
    });

    if (!format || !format.url) {
      return res.status(500).send('動画フォーマットの取得に失敗しました');
    }

    res.setHeader('Content-Type', 'video/mp4');
    ytdl(url, { format }).pipe(res);
  } catch (err) {
    console.error('ストリーミングエラー:', err.message);
    res.status(500).send('動画のストリーミングに失敗しました');
  }
});

// ルート（index.html）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404対応
app.use((req, res) => {
  res.status(404).send('ページが見つかりません');
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ YouTube Stream Proxy Server is running on http://localhost:${PORT}`);
});
