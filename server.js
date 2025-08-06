const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// ストリーム再生用APIエンドポイント
// クエリパラメータ: videoId=動画ID
app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) {
    return res.status(400).send('videoIdパラメータが必要です');
  }

  try {
    // ytdl-coreで動画情報取得＆動画ストリームを抽出
    const info = await ytdl.getInfo(videoId);

    // 最高画質の動画+音声（または音声のみ）を選択（例: itag 22など）
    // ここではmp4の動画+音声が含まれるものを優先して選択
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'audioandvideo' }) ||
                   ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

    if (!format || !format.url) {
      return res.status(404).send('再生可能なフォーマットが見つかりません');
    }

    // レスポンスヘッダー設定
    res.header('Content-Type', 'video/mp4');

    // ytdl-coreで動画ストリームを直接パイプで返す
    ytdl(videoId, {
      quality: format.itag,
      filter: format.hasAudio && format.hasVideo ? 'audioandvideo' : 'audioonly',
      highWaterMark: 1 << 25  // バッファサイズ大きめ
    }).pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send('動画ストリーム取得に失敗しました');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
