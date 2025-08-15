const express = require('express');
const path = require('path');
const { getYouTube } = require('./api');
const { getComments, initYouTubeClient } = require('./comments');

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/api/video/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const videoData = await getYouTube(videoId);
    const comments = await getComments(videoId);

    if (videoData instanceof Error) throw videoData;

    res.json({
      ...videoData,
      comments
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'エラーが発生しました' });
  }
});

const { searchVideos } = require('./search'); 

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

app.get('/api/search', async (req, res) => {
  const q = req.query.q;
  const token = req.query.pageToken;

  try {
    const result = await searchVideos(q, token);
    res.json(result); 
  } catch (err) {
    console.error('search error', err);
    res.status(500).json({ error: '検索エラー' });
  }
});

const { getSuggest } = require('./search');

app.get('/api/suggest', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);
  try {
    const suggestions = await getSuggest(q);
    return res.json(suggestions);
  } catch (e) {
    console.error('suggest error', e);
    return res.json([]);
  }
});

const suggestRoutes = require('./suggest');
app.use('/api', suggestRoutes);

app.listen(PORT, async () => {
  await initYouTubeClient();
  console.log(`✅ サーバー起動中: http://localhost:${PORT}`);
});
