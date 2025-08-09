"use strict";
const YouTubeJS = require("youtubei.js");

let client = null;

/**
 * クライアントをセット（サーバー起動時に呼ぶ）
 * @param {YouTubeJS.Innertube} newClient
 */
function setClient(newClient) {
  client = newClient;
}

/**
 * 動画IDからストリームURL（HLS）を取得
 * @param {string} videoId
 * @returns {Promise<string|null>} ストリームURL or null
 */
async function getStreamUrl(videoId) {
  if (!client) throw new Error("YouTubeクライアントが未初期化です");

  try {
    const info = await client.getInfo(videoId);

    if (!info || !info.streamingData) {
      throw new Error("ストリーム情報が存在しません");
    }

    // streamingData.formatsにHLSがあるか探す
    const hlsFormat = info.streamingData.formats.find(f =>
      f.mimeType.includes("application/x-mpegURL")
    );

    if (hlsFormat && hlsFormat.url) {
      return hlsFormat.url;
    }

    // 代替手段：dashManifestUrlなど使う場合はここに実装可能

    return null;
  } catch (e) {
    console.error(`動画情報取得エラー: ${e.message}`);
    throw e;
  }
}

module.exports = {
  setClient,
  getStreamUrl,
};
