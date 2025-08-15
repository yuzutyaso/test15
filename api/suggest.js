const fetch = require('node-fetch');

// Google検索サジェストを取得するロジック
async function getSuggest(query) {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&ie=utf-8&oe=utf-8&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const text = await res.text();
    const data = JSON.parse(text);
    return data[1];
  } catch (error) {
    console.error('suggest error', error);
    return [];
  }
}

// Vercelサーバーレス関数のハンドラ
module.exports = async (req, res) => {
  try {
    const query = req.query.q;
    const result = await getSuggest(query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Suggest API error:', error);
    res.status(500).json({ error: 'Failed to fetch search suggestions.' });
  }
};
