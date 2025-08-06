const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS許可（必要なら調整）
app.use(cors());

// 静的ファイル（index.html や watch.html 等を置く）
app.use(express.static(path.join(__dirname, 'public')));

// 動画ストリーム用エンドポイント
app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) {
    return res.status(400).send('videoId パラメータが必要です');
  }

  try {
    // YouTube動画情報取得
    const info = await ytdl.getInfo(videoId);

    // mp4コンテナで映像+音声両方ある形式を探す
    const format = info.formats.find(f =>
      f.container === 'mp4' &&
      f.hasVideo === true &&
      f.hasAudio === true &&
      !f.hasDrm
    );

    if (!format) {
      return res.status(404).send('対応する動画フォーマットが見つかりません');
    }

    // レスポンスヘッダー設定（動画ファイルとして）
    res.header('Content-Type', 'video/mp4');
    res.header('Content-Length', format.contentLength || 0);
    // Rangeリクエスト対応もできますが今回はシンプルに

    // ストリーム開始
    const stream = ytdl.downloadFromInfo(info, { format });

    stream.on('error', err => {
      console.error('ストリームエラー:', err);
      try { res.end(); } catch {}
    });

    stream.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send('動画のストリーミングに失敗しました');
  }
});

// その他ルートは静的ファイルが対応

app.listen(PORT, () => {
  console.log(`YouTube Stream Proxy Server is running on port ${PORT}`);
});
