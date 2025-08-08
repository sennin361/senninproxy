const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// public 配下を静的配信
app.use(express.static(path.join(__dirname, 'public')));

// 一時HLS出力ディレクトリ
const TEMP_DIR = path.join(__dirname, 'temp_hls');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// 古いHLSファイル削除
function cleanupOldHLS() {
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(folder => {
      const fullPath = path.join(TEMP_DIR, folder);
      fs.stat(fullPath, (err, stats) => {
        if (!err && stats.isDirectory() && now - stats.ctimeMs > 10 * 60 * 1000) {
          fs.rm(fullPath, { recursive: true, force: true }, () => {});
        }
      });
    });
  });
}
setInterval(cleanupOldHLS, 5 * 60 * 1000);

// HLS変換 & 配信
app.get('/video', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).send('Missing video ID');

  const sessionId = crypto.randomBytes(8).toString('hex');
  const sessionDir = path.join(TEMP_DIR, sessionId);
  fs.mkdirSync(sessionDir);

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const stream = ytdl(url, {
      quality: 'highest',
      highWaterMark: 1 << 25
    });

    ffmpeg(stream)
      .addOptions([
        '-preset veryfast',
        '-g 48',
        '-sc_threshold 0',
        '-hls_time 6',
        '-hls_playlist_type vod',
        `-hls_segment_filename ${path.join(sessionDir, 'segment_%03d.ts')}`
      ])
      .output(path.join(sessionDir, 'playlist.m3u8'))
      .on('end', () => {
        console.log(`[HLS] Generated for ${videoId}`);
      })
      .on('error', err => {
        console.error('[ffmpeg error]', err);
        if (!res.headersSent) res.status(500).send('ffmpeg error');
      })
      .run();

    // 生成した m3u8 へリダイレクト
    res.redirect(`/hls/${sessionId}/playlist.m3u8`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Video processing error');
  }
});

// HLS配信
app.use('/hls', express.static(TEMP_DIR));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
