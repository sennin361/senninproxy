"use strict";

const express = require("express");
const path = require("path");
const compression = require("compression");
const bodyParser = require("body-parser");
const YouTubeJS = require("youtubei.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// ==== アプリ設定 ====
const app = express();
let client; // YouTube APIクライアント

app.use(compression());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set("trust proxy", 1);

// 静的ファイル
app.use(express.static(path.join(__dirname, "public")));

// EJSテンプレート設定
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==== ログインチェック（必要な場合） ====
app.use((req, res, next) => {
  if (
    req.cookies.loginok !== "ok" &&
    !req.path.includes("login") &&
    !req.path.includes("back")
  ) {
    return res.redirect("/login");
  }
  next();
});

// ==== ルーティング ====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// 動画視聴
app.get("/watch", (req, res) => {
  const videoId = req.query.v;
  if (!videoId) return res.status(400).send("動画IDが必要です");
  res.sendFile(path.join(__dirname, "public", "watch.html"));
});

// 動画データAPI（仙人ビュアー用）
app.get("/api/video/:id", async (req, res) => {
  try {
    const videoId = req.params.id;
    const info = await client.getInfo(videoId);
    res.json(info);
  } catch (err) {
    console.error("動画情報取得エラー:", err.message);
    res.status(500).json({ error: "動画情報取得に失敗しました" });
  }
});

// ==== 404ページ ====
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

// ==== YouTube API初期化 ====
async function initInnerTube() {
  try {
    client = await YouTubeJS.Innertube.create({
      lang: "ja",
      location: "JP",
    });
    console.log("YouTubeクライアント初期化成功");

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("YouTubeクライアント初期化失敗:", err.message);
    setTimeout(initInnerTube, 10000); // 10秒後に再試行
  }
}

process.on("unhandledRejection", (err) => {
  console.error("未処理のPromise拒否:", err);
});

initInnerTube();
