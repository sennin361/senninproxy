const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).send('videoIdが必要です');

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    // 🎯 動画＋音声の統合フォーマットを選ぶ（失敗時は分離型を使う）
    const format =
      ytdl.chooseFormat(info.formats, {
        quality: 'highest',
        filter: (f) => f.hasAudio && f.hasVideo && f.container === 'mp4',
      }) ||
      ytdl.chooseFormat(info.formats, {
        quality: 'highest',
        filter: (f) => f.hasAudio && f.hasVideo,
      });

    if (!format || !format.url) {
      console.warn('有効なフォーマットが見つかりません');
      return res.status(500).send('利用可能な動画フォーマットが見つかりません');
    }

    // Debug: ステータス確認用
    console.log(`🎥 Streaming: ${format.qualityLabel} / ${format.container} / ${format.url}`);

    res.setHeader('Content-Type', 'video/mp4');
    ytdl(url, { format }).pipe(res);
  } catch (err) {
    console.error('ストリーミングエラー:', err.message);
    res.status(500).send('動画のストリーミングに失敗しました');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).send('ページが見つかりません');
});

app.listen(PORT, () => {
  console.log(`✅ YouTube Stream Proxy Server is running at http://localhost:${PORT}`);
});
