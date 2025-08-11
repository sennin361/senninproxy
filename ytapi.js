// ytapi.js
const axios = require('axios');

const apis = [
  "https://invidious.snopyta.org",
  "https://invidious.kavin.rocks",
  "https://invidious.namazso.eu",
  "https://invidious.xyz"
];

const MAX_API_WAIT_TIME = 3000;
const MAX_TIME = 10000;

async function ggvideo(videoId) {
  const startTime = Date.now();

  for (const instance of apis) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, { timeout: MAX_API_WAIT_TIME });
      if (response.data && (response.data.formatStreams || response.data.adaptiveFormats)) {
        return response.data;
      }
    } catch (error) {
      console.error(`エラーだよ: ${instance} - ${error.message}`);
    }
    if (Date.now() - startTime >= MAX_TIME) {
      throw new Error("接続がタイムアウトしました");
    }
  }
  throw new Error("動画を取得する方法が見つかりません");
}

async function getYouTube(videoId) {
  try {
    const videoInfo = await ggvideo(videoId);
    const formatStreams = videoInfo.formatStreams || [];
    const adaptiveFormats = videoInfo.adaptiveFormats || [];

    // 動画と音声のストリームを結合しやすい形で用意
    const streamUrls = adaptiveFormats
      .filter(stream => stream.container && stream.url)
      .map(stream => ({
        url: stream.url,
        resolution: stream.resolution || 'audio',
        qualityLabel: stream.qualityLabel || '',
        itag: stream.itag || '',
        mimeType: stream.mimeType || '',
      }));

    return {
      streamUrls,
      videoId,
      channelId: videoInfo.authorId,
      channelName: videoInfo.author,
      channelImage: videoInfo.authorThumbnails?.[videoInfo.authorThumbnails.length - 1]?.url || '',
      videoTitle: videoInfo.title,
      videoDes: videoInfo.descriptionHtml,
      videoViews: videoInfo.viewCount,
      likeCount: videoInfo.likeCount
    };
  } catch (error) {
    throw error;
  }
}

module.exports = { getYouTube };
