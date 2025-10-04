const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/api/itunes', async (req, res) => {
  const { term, country = 'US' } = req.query;

  if (!term) {
    return res.status(400).json({ error: 'Missing required query parameter: term' });
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5&country=${country}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from iTunes API:', error);
    res.status(500).json({ error: 'Failed to fetch data from iTunes API' });
  }
});

module.exports = router;