"use strict";
const express = require("express");
const path = require("path");
const compression = require("compression");
const bodyParser = require("body-parser");
const YouTubeJS = require("youtubei.js");
const video = require("./video");
const cors = require("cors");

const app = express();

app.use(compression());
app.use(express.static(path.join(__dirname, "../public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// API: 動画のストリームURL取得
app.get("/api/video-info", async (req, res) => {
  const videoId = req.query.v;
  if (!videoId) {
    return res.status(400).json({ error: "動画IDが必要です" });
  }

  try {
    const streamUrl = await video.getStreamUrl(videoId);
    if (!streamUrl) {
      return res.status(404).json({ error: "ストリームURLが見つかりません" });
    }
    res.json({ streamUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// シンプルなルート（必要ならトップページなど）
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

// エラーログ
app.on("error", (err) => {
  console.error("サーバーエラー:", err);
});

// YouTubeクライアント初期化してサーバー起動
async function init() {
  try {
    const client = await YouTubeJS.Innertube.create({ lang: "ja", location: "JP" });
    video.setClient(client);
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`サーバー起動 port=${port}`);
    });
  } catch (e) {
    console.error("YouTubeクライアント初期化失敗:", e);
    setTimeout(init, 10000); // 失敗したら10秒後にリトライ
  }
}

init();
