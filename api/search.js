const { Innertube } = require('youtubei.js');
const fetch = require('node-fetch'); // searchVideosには不要ですが、getSuggestと統合する場合に必要

// youtubei.jsクライアントの初期化
let client = null;
async function initClient() {
  if (!client) {
    client = await Innertube.create({ lang: 'ja', location: 'JP' });
  }
}

let previousResult = null;

// YouTube動画を検索するロジック
async function searchVideos(query, pageToken = null) {
  await initClient(); 

  let result;
  if (!pageToken) {
    result = await client.search(query, 'video');
    previousResult = result;
  } else {
    if (previousResult?.getContinuation) {
      result = await previousResult.getContinuation();
      previousResult = result;
    } else {
      console.warn('⚠ continuation not available');
      return { videos: [], nextPageToken: null };
    }
  }

  const videos = result?.results
    ?.filter(item => item.type === 'Video')
    ?.map(video => ({
      id: video.video_id,
      title: video.title?.text || '',
      thumbnail: video.thumbnails?.[0]?.url || ''
    }));

  return {
    videos,
    nextPageToken: videos?.length ? 'hasMore' : null
  };
}

// Vercelサーバーレス関数のハンドラ
// HTTPリクエストを受け付けて、適切なロジックを呼び出す
module.exports = async (req, res) => {
  try {
    const query = req.query.q;
    const pageToken = req.query.nextPageToken;
    const result = await searchVideos(query, pageToken);
    res.status(200).json(result);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Failed to fetch search results.' });
  }
};
