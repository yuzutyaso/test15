const { Innertube } = require('youtubei.js');

let client = null;
async function initClient() {
  if (!client) {
    client = await Innertube.create({ lang: 'ja', location: 'JP' });
  }
}

module.exports = async (req, res) => {
  const videoId = req.query.id; 

  if (!videoId) {
    return res.status(400).json({ error: 'videoIdが指定されていません。' });
  }

  try {
    await initClient();
    const result = await client.getBasicInfo(videoId);
    const details = result.basic_info;
    const streams = result.streaming_data;

    const streamUrls = streams.formats
      .filter(s => s.has_video && !s.is_hls)
      .sort((a, b) => b.width * b.height - a.width * a.height)
      .map(s => ({
        url: s.url,
        resolution: `${s.width}x${s.height}`
      }));
    
    const audioUrl = streams.formats.find(s => s.has_audio && !s.has_video)?.url;
    const commentsResult = await client.getComments(videoId);
    const comments = commentsResult?.results?.map(c => ({
      author: c.author?.name,
      authorPhoto: c.author?.thumbnails?.[0]?.url,
      text: c.content?.text || '',
    }));

    const responseData = {
      videoTitle: details.title,
      channelName: details.author,
      channelImage: details.author_thumbnails?.[0]?.url,
      videoViews: details.view_count,
      videoDes: details.short_description,
      streamUrls,
      audioUrl,
      comments,
    };
    
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Video API Error:', error);
    res.status(500).json({ error: '動画情報の取得に失敗しました。' });
  }
};
