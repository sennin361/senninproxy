"use strict";

let client = null;

function setClient(newClient) {
  client = newClient;
}

async function getStream(videoId) {
  if (!client) throw new Error("YouTube client is not initialized");
  try {
    const info = await client.getInfo(videoId);

    const formats = info.streaming_data.formats || [];
    const sortedFormats = formats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    const bestFormat = sortedFormats[0];

    if (!bestFormat || !bestFormat.url) {
      throw new Error("No playable video format found");
    }

    return {
      title: info.basic_info.title,
      author: info.basic_info.author,
      url: bestFormat.url,
    };
  } catch (err) {
    console.error("getStream error:", err);
    throw err;
  }
}

module.exports = {
  setClient,
  getStream,
};
