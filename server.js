const express = require('express');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

// 指定した動画IDの動画ストリームを返す関数（最大3回リトライ付き）
async function streamVideo(videoId, res) {
  let tries = 0;
  const maxTries = 3;

  while (tries < maxTries) {
    tries++;
    try {
      // YouTube動画情報取得
      const info = await ytdl.getInfo(videoId);

      // 音声＋映像付きの最適フォーマット選択
      const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });

      if (!format || !format.url) {
        throw new Error('有効な動画形式が見つかりません');
      }

      // ストリーム取得
      const stream = ytdl.downloadFromInfo(info, { format });

      // ストリームエラー処理
      stream.on('error', (error) => {
        console.error(`ストリームエラー(試行回数${tries}):`, error.message || error);

        // 410など期限切れの可能性がある場合は再試行
        if (tries < maxTries) {
          stream.destroy();
          // throw して catch に移動し再試行させる
          throw error;
        } else {
          if (!res.headersSent) {
            res.status(500).send('動画のストリーミング中にエラーが発生しました。');
          }
        }
      });

      // レスポンスヘッダーセット
      res.setHeader('Content-Type', 'video/mp4');

      // ストリームをレスポンスへパイプ
      stream.pipe(res);

      // 成功したらループを抜ける
      break;

    } catch (error) {
      console.error(`動画ストリーム取得エラー(試行回数${tries}):`, error.message || error);

      // 最大試行回数超えたらエラー送信
      if (tries >= maxTries) {
        if (!res.headersSent) {
          res.status(500).send('動画の再生中にエラーが発生しました。');
        }
        break;
      }

      // リトライ前に少し待機（1秒）
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

app.get('/video', async (req, res) => {
  const videoId = req.query.id;

  if (!videoId || !ytdl.validateID(videoId)) {
    res.status(400).send('無効な動画IDです');
    return;
  }

  // ストリーミング処理開始
  await streamVideo(videoId, res);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
