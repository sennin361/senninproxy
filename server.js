import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

import YouTubeJS from "youtubei.js";

import ytRoutes from "./routes/yt.js";
import videoRoutes from "./routes/video.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(compression());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set("trust proxy", 1);
app.use(cookieParser());

// 認証チェック例（必要なら）
app.use((req, res, next) => {
  if (req.cookies.loginok !== "ok" && !req.path.includes("login") && !req.path.includes("back")) {
    return res.redirect("/login");
  }
  next();
});

// ルーティング
app.use("/api", videoRoutes);
app.use("/api/yt", ytRoutes);

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

app.get("/login", (req, res) => {
  res.send("ログインページをここに作成してください");
});

// 404
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

app.on("error", console.error);

let client;

async function initInnerTube() {
  try {
    client = await YouTubeJS.Innertube.create({ lang: "ja", location: "JP" });
    ytRoutes.setClient(client);
    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log(process.pid, "Server ready on port", listener.address().port);
    });
  } catch (e) {
    console.error("Innertube初期化失敗:", e);
    setTimeout(initInnerTube, 10000);
  }
}

process.on("unhandledRejection", console.error);

initInnerTube();
