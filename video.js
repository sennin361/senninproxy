import express from "express";
import ytdl from "ytdl-core";
import { infoGet, getComments } from "./yt.js";

const router = express.Router();

router.get("/stream/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing video ID" });

  try {
    const info = await infoGet(id);
    if (!info) return res.status(404).json({ error: "Video not found" });

    // ytdl-coreで最高画質のストリームURLを選択
    const format = ytdl.chooseFormat(info.formats, {
      quality: "highest",
      filter: (format) => format.hasVideo && format.hasAudio,
    });

    res.json({
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      url: format.url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get video stream" });
  }
});

router.get("/comments/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing video ID" });

  try {
    const comments = await getComments(id);
    if (!comments) return res.json([]);

    const parsed = comments.map((c) => ({
      author: c.author?.name || "Unknown",
      date: c.publishedTime || "",
      text: c.content || "",
    }));

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get comments" });
  }
});

export default router;
