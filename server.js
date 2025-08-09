import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";

// 自作モジュール
import { getYouTube } from "./video.js";
import { setClient, getComments, search, getChannel } from "./yt.js";

// YouTube API クライアント（youtubei.js）
import { Innertube } from "youtubei.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// youtubei.js 初期化
(async () => {
  const client = await Innertube.create({
    location: "JP",
    lang: "ja",
    gl: "JP"
  });
  setClient(client);
})();

// 動画ストリーム取得
app.get("/api/stream/:id", async (req, res) => {
  const videoId = req.params.id;
  try {
    const data = await getYouTube(videoId);
    if (!data || !data.stream_url) {
      return res.status(404).json({ error: "動画が見つかりません" });
    }
    res.json({
      title: data.videoTitle,
      author: data.channelName,
      channelId: data.channelId,
      channelImage: data.channelImage,
      description: data.videoDes,
      views: data.videoViews,
      likes: data.likeCount,
      url: data.stream_url,
      resolutions: data.streamUrls
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ストリーム取得失敗" });
  }
});

// コメント取得
app.get("/api/comments/:id", async (req, res) => {
  try {
    const commentsData = await getComments(req.params.id);
    if (!commentsData) return res.json([]);
    const formatted = commentsData.map(c => ({
      author: c.author?.name || "Unknown",
      date: c.published || "",
      text: c.content || ""
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "コメント取得失敗" });
  }
});

// 検索
app.get("/api/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "クエリが必要です" });
  try {
    const results = await search(q);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "検索失敗" });
  }
});

// チャンネル情報取得
app.get("/api/channel/:id", async (req, res) => {
  try {
    const data = await getChannel(req.params.id);
    res.json(data || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "チャンネル取得失敗" });
  }
});

// 静的ファイル配信
app.use(express.static(path.join(__dirname, "public")));

// SPA用フォールバック
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
