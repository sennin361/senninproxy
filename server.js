// server.js
const express = require('express');
const path = require('path');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイル配信（publicフォルダ）
app.use(express.static(path.join(__dirname, 'public')));

// YouTube動画ストリーミングエンドポイント
app.get('/video', async (req, res) => {
  const videoId = req.query.id;

  if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
    return res.status(400).send('Error: 動画IDが指定されていません');
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // 動画情報の取得
    const info = await ytdl.getInfo(url);

    // HLS形式の動画フォーマットをフィルター
    const hlsFormats = ytdl.filterFormats(info.formats, 'hls');

    if (!hlsFormats || hlsFormats.length === 0) {
      return res.status(404).send('Error: HLS形式の動画が見つかりません');
    }

    // 最初のHLS URLにリダイレクト
    res.redirect(hlsFormats[0].url);

  } catch (error) {
    console.error('動画ストリーミング中にエラーが発生しました:', error);

    // ytdl-core固有のエラーやネットワークエラーを詳細に分ける
    if (error instanceof ytdl.errors.VideoUnavailable) {
      return res.status(404).send('Error: 指定された動画は利用できません');
    }

    if (error.message && error.message.includes('status code: 410')) {
      return res.status(410).send('Error: 動画は再生できません（410 Gone）');
    }

    return res.status(500).send('Error: サーバー内部エラーが発生しました');
  }
});

// ルートパスは index.html を返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      console.error('index.htmlの送信中にエラー:', err);
      res.status(500).send('Error: ファイル送信中にエラーが発生しました');
    }
  });
});

// 404ハンドラー（他のルートがなければ）
app.use((req, res) => {
  res.status(404).send('Error 404: ページが見つかりません');
});

// グローバル例外ハンドラー（万が一）
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection:', err);
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
