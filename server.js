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
let client;

// 共通ミドルウェア
app.use(compression());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set("trust proxy", 1);
app.use(cookieParser());

// 認証チェック
app.use((req, res, next) => {
    try {
        if (req.cookies.loginok !== "ok" && !req.path.includes("login") && !req.path.includes("back")) {
            return res.redirect("/login");
        }
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        res.status(500).send("Internal server error");
    }
});

// ルート: /
app.get("/", (req, res) => {
    try {
        if (req.query.r === "y") {
            res.render("home/index");
        } else {
            res.redirect("/wkt");
        }
    } catch (err) {
        console.error("/", err);
        res.status(500).send("Internal server error");
    }
});

// アプリページ
app.get("/app", (req, res) => {
    try {
        res.render("app/list");
    } catch (err) {
        console.error("/app", err);
        res.status(500).send("Internal server error");
    }
});

// サブルート
app.use("/wkt", safeRequire("./routes/wakametube"));
app.use("/game", safeRequire("./routes/game"));
app.use("/tools", safeRequire("./routes/tools"));
app.use("/pp", safeRequire("./routes/proxy"));
app.use("/wakams", safeRequire("./routes/music"));
app.use("/blog", safeRequire("./routes/blog"));
app.use("/sandbox", safeRequire("./routes/sandbox"));

// ログイン
app.get("/login", (req, res) => {
    try {
        res.render("home/login");
    } catch (err) {
        console.error("/login", err);
        res.status(500).send("Internal server error");
    }
});

// 動画ページ
app.get("/watch", (req, res) => {
    try {
        const videoId = req.query.v;
        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            res.redirect(`/wkt/watch/${videoId}`);
        } else {
            res.redirect(`/wkt/trend`);
        }
    } catch (err) {
        console.error("/watch", err);
        res.status(500).send("Internal server error");
    }
});

// チャンネル
app.get("/channel/:id", (req, res) => {
    try {
        res.redirect(`/wkt/c/${encodeURIComponent(req.params.id)}`);
    } catch (err) {
        console.error("/channel/:id", err);
        res.status(500).send("Internal server error");
    }
});
app.get("/channel/:id/join", (req, res) => {
    try {
        res.redirect(`/wkt/c/${encodeURIComponent(req.params.id)}`);
    } catch (err) {
        console.error("/channel/:id/join", err);
        res.status(500).send("Internal server error");
    }
});

// ハッシュタグ
app.get("/hashtag/:des", (req, res) => {
    try {
        res.redirect(`/wkt/s?q=${encodeURIComponent(req.params.des)}`);
    } catch (err) {
        console.error("/hashtag/:des", err);
        res.status(500).send("Internal server error");
    }
});

// 404
app.use((req, res) => {
    res.status(404).render("error.ejs", {
        title: "404 Not found",
        content: "そのページは存在しません。",
    });
});

// サブルート読み込み安全関数
function safeRequire(routePath) {
    try {
        return require(routePath);
    } catch (err) {
        console.error(`Failed to load route: ${routePath}`, err);
        return (req, res) => res.status(500).send("Route temporarily unavailable");
    }
}

// アプリエラー
app.on("error", (err) => {
    console.error("Express App Error:", err);
});

// YouTubeクライアント初期化（自動リトライ付き）
async function initInnerTube() {
    try {
        client = await YouTubeJS.Innertube.create({ lang: "ja", location: "JP" });
        serverYt.setClient(client);
        const listener = app.listen(process.env.PORT || 3000, () => {
            console.log(process.pid, "Ready.", listener.address().port);
        });
    } catch (e) {
        console.error("InnerTube Init Error:", e);
        setTimeout(initInnerTube, 10000);
    }
}

// グローバル例外キャッチ
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

initInnerTube();
