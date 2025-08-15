const YouTubeJS = require("youtubei.js");

let client = null;

async function initYouTubeClient() {
  client = await YouTubeJS.Innertube.create({ lang: "ja", location: "JP" });
  return client;
}

async function getComments(videoId, maxPages = 2) {
  if (!client) await initYouTubeClient();

  try {
    let commentSection = await client.getComments(videoId);
    const results = [];

    let page = 0;
    while (commentSection && commentSection.contents && page < maxPages) {
      for (const thread of commentSection.contents) {
        const comment = thread.comment;
        const text =
          comment?.content?.text ||
          comment?.content?.runs?.map(r => r.text).join('') ||
          '';
        const author = comment?.author?.name || '不明';
        const authorPhoto = comment?.author?.thumbnails?.[0]?.url || null;

        results.push({ text, author, authorPhoto });
      }

      if (commentSection.continuation) {
        commentSection = await client.getComments(videoId, commentSection.continuation);
        page++;
      } else {
        break;
      }
    }

    return results;
  } catch (err) {
    console.error('❌ コメント取得失敗:', err.message);
    return [];
  }
}

module.exports = {
  getComments,
  initYouTubeClient
};
