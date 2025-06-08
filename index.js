const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = './links.json';

// Parse JSON in requests
app.use(express.json());

// Create links.json file if missing
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Upload endpoint (POST /upload)
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

// Root endpoint returns a random link (GET /)
app.get('/', (req, res) => {
  const links = JSON.parse(fs.readFileSync(DATA_FILE));
  if (links.length === 0) {
    return res.status(404).send('No links available.');
  }

  const randomLink = links[Math.floor(Math.random() * links.length)];

  // Directly redirect user to the random link
  res.redirect(randomLink);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});