const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイル配信(publicフォルダにwatch.htmlなどを配置)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/video', (req, res) => {
  const videoId = req.query.id;
  if (!videoId) {
    res.status(400).send('Missing video id');
    return;
  }

  const videoURL = `https://www.youtube.com/watch?v=${videoId}`;

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Cache-Control', 'no-cache');

  try {
    const stream = ytdl(videoURL, {
      quality: 'highest',
      filter: (format) => format.container === 'mp4' && format.hasAudio && format.hasVideo,
      highWaterMark: 1 << 25,
    });

    ffmpeg(stream)
      .addOptions([
        '-preset veryfast',
        '-g 48',
        '-sc_threshold 0',
        '-hls_time 6',
        '-hls_list_size 5',
        '-hls_flags delete_segments+temp_file',
        '-hls_allow_cache 0',
        '-hls_segment_type mpegts',
        '-start_number 0',
      ])
      .format('hls')
      .on('start', (cmd) => {
        console.log('FFmpeg start:', cmd);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        if (!res.headersSent) {
          res.status(500).send('FFmpeg error');
        }
      })
      .pipe(res, { end: true });
  } catch (e) {
    console.error('Error:', e);
    if (!res.headersSent) {
      res.status(500).send('Server error');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
