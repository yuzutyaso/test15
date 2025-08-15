const fetch = require('node-fetch');

async function getSuggest(query) {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&ie=utf-8&oe=utf-8&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const text = await res.text();

    // JSON.parse を使って手動で解析
    const data = JSON.parse(text);

    return data[1];
  } catch (error) {
    console.error('suggest error', error);
    return [];
  }
}

const { Innertube } = require('youtubei.js');
let client = null;

async function initClient() {
  if (!client) {
    client = await Innertube.create({ lang: 'ja', location: 'JP' });
  }
}

let previousResult = null;

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
module.exports = {
  searchVideos,
  getSuggest
};