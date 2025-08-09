const express = require("express");
const ytdl = require("ytdl-core");
const { infoGet, getComments } = require("./yt");

const router = express.Router();

/**
 * GET /api/stream/:id
 * 動画情報と直接再生可能なストリームURLを返す
 */
router.get("/stream/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing video ID" });

  try {
    const info = await infoGet(id);
    if (!info) return res.status(404).json({ error: "Video not found" });

    // 動画の最適なフォーマットを取得（mp4かつ音声付き）
    const format = ytdl.chooseFormat(info.formats, { quality: "highest", filter: "audioandvideo" });

    res.json({
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      url: format.url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get video stream" });
  }
});

/**
 * GET /api/comments/:id
 * コメント一覧を返す
 */
router.get("/comments/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing video ID" });

  try {
    const comments = await getComments(id);
    if (!comments) return res.json([]);

    const parsed = comments.map(c => ({
      author: c.author?.name || "Unknown",
      date: c.publishedTime || "",
      text: c.content || ""
    }));

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get comments" });
  }
});

module.exports = router;
