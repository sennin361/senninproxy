"use strict";

const express = require("express");
const path = require("path");
const compression = require("compression");
const bodyParser = require("body-parser");
const YouTubeJS = require("youtubei.js");
const serverYt = require("./server/youtube.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");

let app = express();
let client = null;

// ミドルウェア
app.use(compression());
app.use(express.static(path.join(__dirname, "public"))); // public フォルダを静的配信
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set("trust proxy", 1);
app.use(cookieParser());

// 強制ログインチェックは削除（login.html不要化）
// app.use((req, res, next) => { ... });

// "/" にアクセスしたら public/index.html を返す
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 動画ストリーム取得API
app.get("/api/stream/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const streamData = await serverYt.getStream(id);
    res.json(streamData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stream" });
  }
});

// 動画情報取得API
app.get("/api/info/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const info = await serverYt.infoGet(id);
    res.json(info);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch info" });
  }
});

// 検索API
app.get("/api/search", async (req, res) => {
  const q = req.query.q;
  try {
    const results = await serverYt.search(q);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search" });
  }
});

// チャンネル情報取得API
app.get("/api/channel/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const results = await serverYt.getChannel(id);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get channel" });
  }
});

// コメント取得API
app.get("/api/comments/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const results = await serverYt.getComments(id);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get comments" });
  }
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

app.on("error", console.error);

// YouTubeクライアント初期化
async function initInnerTube() {
  try {
    client = await YouTubeJS.Innertube.create({ lang: "ja", location: "JP" });
    serverYt.setClient(client);

    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log(process.pid, "Ready.", listener.address().port);
    });
  } catch (e) {
    console.error("YouTubeクライアント初期化失敗:", e);
    setTimeout(initInnerTube, 10000); // 10秒後に再試行
  }
}

process.on("unhandledRejection", console.error);
initInnerTube();
