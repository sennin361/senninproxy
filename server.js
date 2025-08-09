import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 環境変数
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

// ストリームURL取得（簡易版）
app.get("/api/stream/:id", async (req, res) => {
  const videoId = req.params.id;

  try {
    // 本来はYouTube APIやytdlpでストリームURLを取得する
    // ここではデモ用にMP4直リンクを返す
    const data = {
      title: "デモ動画",
      author: "Lentrance Reader",
      url: `https://example.com/videos/${videoId}.mp4`
    };
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ストリームURL取得失敗" });
  }
});

// コメント取得（簡易版）
app.get("/api/comments/:id", async (req, res) => {
  const videoId = req.params.id;

  try {
    // 本来はYouTube API commentThreads で取得
    // ここではダミーコメント
    const comments = [
      {
        author: "Alice",
        date: new Date().toLocaleString(),
        text: "素晴らしい動画ですね！"
      },
      {
        author: "Bob",
        date: new Date().toLocaleString(),
        text: "とても参考になりました。"
      }
    ];
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "コメント取得失敗" });
  }
});

// 静的ファイル配信（publicフォルダにHTML等を置く）
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
