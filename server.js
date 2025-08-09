"use strict";

const express = require("express");
const path = require("path");
const compression = require("compression");
const bodyParser = require("body-parser");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const YouTubeJS = require("youtubei.js");
const serverYt = require("./server/youtube.js");

const app = express();
let client;

app.use(compression());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.set("trust proxy", 1);

// ↓ 認証系やログイン系が不要ならこのミドルウェアを外してもOKです
app.use((req, res, next) => {
  // 認証無効化（もし不要なら削除可能）
  next();
});

// ルート（index.htmlを返す）
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// watch.html へのルート
app.get("/watch", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "watch.html"));
});

// game.html へのルート
app.get("/game", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game.html"));
});

// YouTubeストリーム関連APIなどをyoutube.jsで実装するならAPIルートを用意
app.get("/api/stream", async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) {
    return res.status(400).json({ error: "動画IDが必要です" });
  }
  try {
    const streamInfo = await serverYt.getStream(videoId);
    res.json(streamInfo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "動画の取得に失敗しました" });
  }
});

// 404ページ（ファイル見つからない場合）
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

app.on("error", console.error);

async function initInnerTube() {
  try {
    client = await YouTubeJS.Innertube.create({ lang: "ja", location: "JP" });
    serverYt.setClient(client);
    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${listener.address().port}`);
    });
  } catch (e) {
    console.error("Innertube 初期化失敗:", e);
    setTimeout(initInnerTube, 10000);
  }
}

process.on("unhandledRejection", console.error);

initInnerTube();
