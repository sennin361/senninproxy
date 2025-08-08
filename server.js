const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイルをpublicフォルダから提供
app.use(express.static(path.join(__dirname, 'public')));

app.get('/video', (req, res) => {
  const videoId = req.query.id;
  if (!videoId) {
    res.status(400).send('Missing video id');
    return;
  }

  const videoURL = `https://www.youtube.com/watch?v=${videoId}`;

  // HLS (m3u8) コンテンツタイプ
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Cache-Control', 'no-cache');

  // YouTubeから動画をダウンロード (最高画質のmp4形式)
  const stream = ytdl(videoURL, {
    quality: 'highest',
    filter: format => format.container === 'mp4' && format.hasAudio && format.hasVideo,
    highWaterMark: 1 << 25,
  });

  // ffmpegでHLS変換してリアルタイム配信
  ffmpeg(stream)
    .addOptions([
      '-preset veryfast',       // エンコード速度優先
      '-g 48',                 // GOPサイズ（2秒間隔、fps=24として）
      '-sc_threshold 0',       // シーンカット検出OFF
      '-hls_time 6',           // セグメント長6秒
      '-hls_list_size 5',      // プレイリスト内の最大セグメント数
      '-hls_flags delete_segments+temp_file', // 古いセグメント削除
      '-hls_allow_cache 0',    // キャッシュ禁止
      '-hls_segment_type mpegts', // セグメントタイプ
      '-start_number 0',       // セグメント番号開始
    ])
    .format('hls')
    .on('start', commandLine => {
      console.log('FFmpeg start:', commandLine);
    })
    .on('error', err => {
      console.error('FFmpeg error:', err);
      if (!res.headersSent) {
        res.status(500).send('FFmpeg error');
      }
    })
    .pipe(res, { end: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
