

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const UserAgent = require('fake-useragent');
const PORT = process.env.PORT || 3000;
const app = express();
const DATA_FILE = './links.json';
const jsongen = async (url) => {
  const headers = {
    'X-Signature-Version': 'web2',
    'X-Signature': crypto.randomBytes(32).toString('hex'),
    'User-Agent': new UserAgent().random,
  };
  const res = await axios.get(url, { headers });
  return res.data;
};

const getRandomVideo = async () => {
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const url = `https://hanime.tv/api/v8/browse-trending?time=month&page=${randomPage}&order_by=views&ordering=desc`;
  const data = await jsongen(url);
  const videos = data.hentai_videos;
  const random = videos[Math.floor(Math.random() * videos.length)];
  return random.slug;
};

const getVideoInfo = async (slug) => {
  const url = `https://hanime.tv/api/v8/video?id=${slug}`;
  const data = await jsongen(url);
  const streams = data.videos_manifest?.servers?.[0]?.streams || [];
  return {
    slug: slug,
    duration: data.hentai_video?.duration_in_ms || 600000,
    streamUrl: streams.find(s => s.url && s.url.endsWith('.m3u8'))?.url || null
  };
};

app.get('/fvideo', async (req, res) => {
  try {
    const slug = await getRandomVideo();
    const info = await getVideoInfo(slug);

    if (!info.streamUrl) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const totalSec = Math.floor(info.duration / 1000);
    const start = Math.floor(Math.random() * (totalSec - 60));

    res.json({
      slug: slug,
      video_url: info.streamUrl,
      start_seconds: start,
      duration: 60
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.use(express.json());

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

app.post('/upload', (req, res) => {
  const { links } = req.body;
  if (!Array.isArray(links)) {
    return res.status(400).json({ error: 'links must be an array' });
  }

  const existingLinks = JSON.parse(fs.readFileSync(DATA_FILE));
  const combined = [...new Set([...existingLinks, ...links])];
  fs.writeFileSync(DATA_FILE, JSON.stringify(combined, null, 2));

  res.json({ success: true, total: combined.length });
  
});

app.get('/', (req, res) => {
  const links = JSON.parse(fs.readFileSync(DATA_FILE));
  if (links.length === 0) {
    return res.status(404).send('No links available.');
  }

  const randomLink = links[Math.floor(Math.random() * links.length)];
  res.redirect(randomLink);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
      
