"use strict";

const express = require("express");
const path = require("path");
const compression = require("compression");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const YouTubeJS = require("youtubei.js");
const serverYt = require("./server/youtube.js");

const app = express();

let client = null;

// ミドルウェア設定
app.use(compression());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);

// 認証の簡易チェック（必要に応じて無効化可能）
app.use((req, res, next) => {
  if (req.cookies.loginok !== "ok" && !req.path.includes("login") && !req.path.includes("back")) {
    return res.redirect("/login");
  }
  next();
});

// テンプレート設定（ejs）
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ルート
app.get("/", (req, res) => {
  if (req.query.r === "y") {
    res.render("home/index");
  } else {
    res.redirect("/wkt");
  }
});

app.get("/app", (req, res) => {
  res.render("app/list");
});

// 外部ルートを使う例（必要に応じて作成）
app.use("/wkt", require("./routes/wakametube"));
app.use("/game", require("./routes/game"));
app.use("/tools", require("./routes/tools"));
app.use("/pp", require("./routes/proxy"));
app.use("/wakams", require("./routes/music"));
app.use("/blog", require("./routes/blog"));
app.use("/sandbox", require("./routes/sandbox"));

// ログイン画面
app.get("/login", (req, res) => {
  res.render("home/login");
});

// 動画視聴リダイレクト
app.get("/watch", (req, res) => {
  const videoId = req.query.v;
  if (videoId) {
    res.redirect(`/wkt/watch/${videoId}`);
  } else {
    res.redirect("/wkt/trend");
  }
});

// チャンネル関連リダイレクト
app.get("/channel/:id", (req, res) => {
  const id = req.params.id;
  res.redirect(`/wkt/c/${id}`);
});
app.get("/channel/:id/join", (req, res) => {
  const id = req.params.id;
  res.redirect(`/wkt/c/${id}`);
});

// ハッシュタグリダイレクト
app.get("/hashtag/:des", (req, res) => {
  const des = req.params.des;
  res.redirect(`/wkt/s?q=${des}`);
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).render("error.ejs", {
    title: "404 Not found",
    content: "そのページは存在しません。",
  });
});

// グローバルエラーハンドラー
app.on("error", console.error);

// YouTubeクライアント初期化関数
async function initInnerTube() {
  try {
    client = await YouTubeJS.Innertube.create({ lang: "ja", location: "JP" });
    serverYt.setClient(client);

    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log(process.pid, "Server ready on port", listener.address().port);
    });
  } catch (e) {
    console.error("InnerTube init error:", e);
    setTimeout(initInnerTube, 10000);
  }
}

// 未処理のPromise拒否をログ
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at:", p, "reason:", reason);
});

// サーバ起動
initInnerTube();

module.exports = app;
