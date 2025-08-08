"use strict";

// ============================
// 必要なモジュール読み込み
// ============================
const express = require("express");
const path = require("path");
const compression = require("compression");
const { Innertube } = require("youtubei.js");

// ============================
// アプリ初期化
// ============================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================
// YouTubeクライアント
// ============================
let youtubeClient = null;

/**
 * YouTubeクライアント初期化
 */
async function initYouTubeClient() {
  if (!youtubeClient) {
    try {
      youtubeClient = await Innertube.create();
      console.log("✅ YouTube client initialized");
    } catch (err) {
      console.error("❌ YouTube client initialization failed:", err);
      throw new Error("YouTube client init error");
    }
  }
}

/**
 * 動画情報取得
 */
async function getVideoInfo(videoId) {
  await initYouTubeClient();
  try {
    const info = await youtubeClient.getInfo(videoId);
    return {
      title: info.basic_info?.title || "無題",
      author: info.basic_info?.author || "不明",
      description: info.basic_info?.short_description || "",
      url: info.streaming_data?.formats?.[0]?.url || null,
      formats: info.streaming_data?.formats || [],
      adaptiveFormats: info.streaming_data?.adaptive_formats || []
    };
  } catch (err) {
    console.error("動画情報取得エラー:", err);
    throw err;
  }
}

/**
 * コメント取得
 */
async function getComments(videoId) {
  await initYouTubeClient();
  try {
    const thread = await youtubeClient.getComments(videoId);
    return thread.comments.map(c => ({
      author: c.author?.name || "匿名",
      text: c.content?.text || "",
      published: c.published
    }));
  } catch (err) {
    console.error("コメント取得エラー:", err);
    throw err;
  }
}

// ============================
// ミドルウェア設定
// ============================
app.use(compression()); // レスポンス圧縮
app.use(express.json()); // JSONボディパース
app.use(express.static(path.join(__dirname, "public"))); // publicフォルダ配信

// ============================
// APIルート
// ============================
/**
 * 動画情報API
 */
app.get("/api/video/:id", async (req, res) => {
  try {
    const data = await getVideoInfo(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "動画情報の取得に失敗しました" });
  }
});

/**
 * コメントAPI
 */
app.get("/api/comments/:id", async (req, res) => {
  try {
    const comments = await getComments(req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "コメントの取得に失敗しました" });
  }
});

// ============================
// ルートアクセス時 index.html 表示
// ============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================
// サーバー起動
// ============================
app.listen(PORT, () => {
  console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
});
