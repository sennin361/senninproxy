const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORSと静的ファイルの設定
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 🎥 動画ストリームエンドポイント（リダイレクト方式推奨）
app.get('/stream', async (req, res) => {
  const { videoId, itag } = req.query;

  if (!videoId || !itag) {
    return res.status(400).send('Missing videoId or itag');
  }

  try {
    const info = await ytdl.getInfo(videoId);
    const format = ytdl.chooseFormat(info.formats, { quality: itag });

    if (!format || !format.url) {
      return res.status(404).send('Format not found');
    }

    // ストリーミングURLへリダイレクト（スマホ対応）
    res.redirect(format.url);
  } catch (error) {
    console.error('ストリーミングエラー:', error.message);
    res.status(500).send('ストリーミングエラー: ' + error.message);
  }
});

// 📺 利用可能なフォーマットを返すエンドポイント
app.get('/formats', async (req, res) => {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).send('Missing videoId');
  }

  try {
    const info = await ytdl.getInfo(videoId);

    // mp4形式かつ映像・音声両方を含むフォーマットを取得
    const formats = info.formats
      .filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4')
      .map(f => ({
        itag: f.itag,
        quality: f.qualityLabel || f.quality,
        bitrate: f.bitrate,
        fps: f.fps
      }));

    // 重複 itag を削除
    const unique = [];
    const seen = new Set();
    for (const f of formats) {
      if (!seen.has(f.itag)) {
        unique.push(f);
        seen.add(f.itag);
      }
    }

    res.json(unique);
  } catch (error) {
    console.error('フォーマット取得エラー:', error.message);
    res.status(500).send('フォーマット取得エラー');
  }
});

// SPA対応: それ以外のルートは index.html を返す
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ YouTube Stream Proxy Server is running on port ${PORT}`);
});
