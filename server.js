"use strict";

const express = require("express");
const path = require("path");
const cors = require("cors");
const compression = require("compression");
const bodyParser = require("body-parser");

const youtube = require("./server/youtube.js"); // YouTube処理用自作モジュール

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// API: 動画ストリーム情報取得
app.get("/api/stream/:id", async (req, res) => {
  const videoId = req.params.id;
  if (!videoId) {
    return res.status(400).json({ error: "動画IDが指定されていません。" });
  }
  try {
    const streamData = await youtube.getStream(videoId);
    if (!streamData || !streamData.url) {
      return res.status(404).json({ error: "動画ストリームが見つかりません。" });
    }
    res.json({
      title: streamData.title,
      author: streamData.author,
      url: streamData.url,
    });
  } catch (error) {
    console.error("動画ストリーム取得失敗:", error);
    res.status(500).json({ error: "動画の取得に失敗しました。" });
  }
});

// API: コメント取得
app.get("/api/comments/:id", async (req, res) => {
  const videoId = req.params.id;
  if (!videoId) {
    return res.status(400).json([]);
  }
  try {
    const commentsRaw = await youtube.getComments(videoId);
    // コメントの形式は自作youtube.jsの仕様に応じて変えてください
    const comments = (commentsRaw?.comments || []).map((c) => ({
      author: c.author.name,
      date: new Date(c.publishedAt).toLocaleString(),
      text: c.text,
    }));
    res.json(comments);
  } catch (error) {
    console.error("コメント取得失敗:", error);
    res.status(500).json([]);
  }
});

// ルート（トップ）で index.html を返す
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// それ以外は404エラー
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

// サーバ起動時に YouTubeクライアントを初期化
async function init() {
  try {
    // youtube.js内で YouTube APIクライアント初期化処理を行う場合はここで呼び出すなど
    // 例: await youtube.initClient();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error("初期化失敗:", e);
    setTimeout(init, 10000);
  }
}

init();

module.exports = app;
