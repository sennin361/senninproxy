// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');
const { getYouTube } = require('./ytapi');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// 動画メタ情報取得API
app.get('/api/stream/:id', async (req, res) => {
  try {
    const info = await getYouTube(req.params.id);
    res.json({
      title: info.videoTitle,
      author: info.channelName,
      streamUrls: info.streamUrls
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '動画情報取得失敗' });
  }
});

// Range対応ストリームAPI
app.get('/api/stream/:id/:res', async (req, res) => {
  const { id, res: resolution } = req.params;
  try {
    const info = await getYouTube(id);
    const targetStream = info.streamUrls.find(v => v.resolution === resolution);
    if (!targetStream) {
      return res.status(404).send("指定の解像度がありません");
    }

    const range = req.headers.range || "";
    const streamUrl = targetStream.url;

    const response = await axios.get(streamUrl, {
      responseType: "stream",
      headers: { Range: range }
    });

    res.writeHead(response.status, response.headers);
    response.data.pipe(res);
  } catch (err) {
    console.error("ストリーム取得失敗:", err);
    res.status(500).send("ストリーム取得失敗");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
