const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ 動画のストリーム再生エンドポイント
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

    res.setHeader('Content-Type', 'video/mp4');
    ytdl(videoId, { quality: itag }).pipe(res);
  } catch (error) {
    console.error('ストリーミングエラー:', error.message);
    res.status(500).send('ストリーミングエラー: ' + error.message);
  }
});

// ✅ 利用可能なフォーマット一覧を返すエンドポイント
app.get('/formats', async (req, res) => {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).send('Missing videoId');
  }

  try {
    const info = await ytdl.getInfo(videoId);
    const formats = info.formats
      .filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4')
      .map(f => ({
        itag: f.itag,
        quality: f.qualityLabel || f.quality,
        bitrate: f.bitrate,
        fps: f.fps
      }));

    // 重複 itag を排除
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

// ✅ その他のルートは index.html を返す（SPA対応）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ サーバー起動
app.listen(PORT, () => {
  console.log(`✅ YouTube Stream Proxy Server is running on port ${PORT}`);
});
