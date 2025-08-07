const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイル配信（index.htmlやwatch.htmlなどをpublicに置く想定）
app.use(express.static(path.join(__dirname, 'public')));

// 動画ストリーミングエンドポイント
app.get('/video', (req, res) => {
  const videoId = req.query.id;
  if (!videoId) {
    return res.status(400).send('動画IDが指定されていません');
  }

  // ここでは videoId.mp4 のファイルを public/videos フォルダから配信すると仮定
  const videoPath = path.join(__dirname, 'public', 'videos', `${videoId}.mp4`);

  fs.stat(videoPath, (err, stats) => {
    if (err) {
      return res.status(404).send('動画が見つかりません');
    }

    const range = req.headers.range;
    if (!range) {
      // Rangeヘッダーがない場合、全体を送る（推奨はしない）
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(videoPath).pipe(res);
    } else {
      // Rangeヘッダーを解釈して部分配信（動画ストリーミング用）
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(videoPath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      stream.pipe(res);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
