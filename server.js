const express = require('express');
const path = require('path');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイル配信（publicフォルダ）
app.use(express.static(path.join(__dirname, 'public')));

// HLS配信エンドポイント
app.get('/video', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId || !ytdl.validateID(videoId)) {
    return res.status(400).send('Invalid video ID');
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const stream = ytdl(url, {
      quality: 'highest',
      filter: 'audioandvideo',
      highWaterMark: 1 << 25
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

    ffmpeg(stream)
      .addOptions([
        '-preset veryfast',
        '-g 48',
        '-sc_threshold 0',
        '-map 0:v:0',
        '-map 0:a:0',
        '-c:v libx264',
        '-c:a aac',
        '-f hls',
        '-hls_time 5',
        '-hls_list_size 6',
        '-hls_flags delete_segments',
        '-hls_allow_cache 0'
      ])
      .outputFormat('hls')
      .on('error', (err) => {
        console.error('FFmpeg error:', err.message);
        res.status(500).send('FFmpeg failed');
      })
      .pipe(res, { end: true });

  } catch (err) {
    console.error(err);
    res.status(500).send('Streaming failed');
  }
});

app.listen(PORT, () => {
  console.log(`✅ サーバー起動中: http://localhost:${PORT}`);
});
