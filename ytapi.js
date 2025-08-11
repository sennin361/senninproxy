// ytapi.js
const axios = require('axios');

let apis = null;
const MAX_API_WAIT_TIME = 3000; 
const MAX_TIME = 10000;

async function getapis() {
    try {
        const response = await axios.get('https://raw.githubusercontent.com/wakame02/wktopu/refs/heads/main/inv.json');
        apis = await response.data;
        console.log('データを取得しました:', apis);
    } catch (error) {
        console.error('データの取得に失敗しました:', error);
        await getapisgit();
    }
}

async function getapisgit() {
    try {
        const response = await axios.get('https://raw.githubusercontent.com/wakame02/wktopu/refs/heads/main/inv.json');
        apis = await response.data;
        console.log('データを取得しました:', apis);
    } catch (error) {
        console.error('データの取得に失敗しました:', error);
    }
}

async function ggvideo(videoId) {
  const startTime = Date.now();
  for (let i = 0; i < 20; i++) {
    if (Math.floor(Math.random() * 20) === 0) {
        await getapis();
    }
  }
  if(!apis){
    await getapisgit();
  }
  for (const instance of apis) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, { timeout: MAX_API_WAIT_TIME });
      if (response.data && response.data.formatStreams) {
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
    const audioStreams = videoInfo.adaptiveFormats || [];

    const streamUrls = audioStreams
      .filter(stream => stream.container === 'webm' && stream.resolution)
      .map(stream => ({
        url: stream.url,
        resolution: stream.resolution,
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
