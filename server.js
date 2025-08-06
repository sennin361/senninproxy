const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).send('Missing videoId');

  try {
    const info = await ytdl.getInfo(videoId);
    const format = ytdl.chooseFormat(info.formats, {
      quality: '18', // MP4 360p with audio
      filter: 'audioandvideo'
    });

    if (!format || !format.url) {
      return res.status(404).send('No streamable format found');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.redirect(format.url);
  } catch (error) {
    console.error('Error retrieving stream:', error.message);
    res.status(500).send('Failed to retrieve stream');
  }
});

app.listen(PORT, () => {
  console.log(`YouTube Stream Proxy Server is running on http://localhost:${PORT}`);
});
