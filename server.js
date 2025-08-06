const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// ✅ 動作確認用ルート
app.get('/', (req, res) => {
  res.send('YouTube Stream Proxy Server is running.');
});

// 🎥 ストリーミング用エンドポイント
app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;

  if (!videoId || !ytdl.validateID(videoId)) {
    return res.status(400).send('無効な videoId です。');
  }

  try {
    const info = await ytdl.getInfo(videoId);
    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highest',
      filter: 'audioandvideo'
    });

    if (!format || !format.url) {
      return res.status(404).send('適切なフォーマットが見つかりませんでした。');
    }

    res.setHeader('Content-Type', 'video/mp4');
    ytdl(videoId, {
      format,
      quality: 'highest',
      filter: 'audioandvideo',
    }).pipe(res);

  } catch (err) {
    console.error('ストリーム取得エラー:', err);
    res.status(500).send('ストリームの取得中にエラーが発生しました。');
  }
});

// 🚀 サーバー起動
app.listen(PORT, () => {
  console.log(`✅ サーバー起動: http://localhost:${PORT}`);
});
