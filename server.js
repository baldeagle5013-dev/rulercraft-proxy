// server.js
const express = require('express');
const app = express();

// Dynmap markers file we will proxy
const MARKER_URL = process.env.MARKER_URL || 'https://map.rulercraft.com/tiles/_markers_/marker_RulerEarth.json';

let cacheText = null;
let cacheAt = 0;
const CACHE_MS = 15 * 1000; // 15s cache

app.get('/markers', async (req, res) => {
  try {
    const now = Date.now();
    if (cacheText && (now - cacheAt) < CACHE_MS) {
      res.set('Content-Type', 'application/json');
      res.set('Access-Control-Allow-Origin', '*');
      return res.send(cacheText);
    }

    // Use global fetch (Render uses Node 18+)
    const r = await fetch(MARKER_URL);
    if (!r.ok) return res.status(502).json({ error: 'Upstream fetch failed', status: r.status });
    const text = await r.text();

    cacheText = text;
    cacheAt = now;

    res.set('Content-Type', 'application/json');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'proxy error' });
  }
});

app.get('/', (req, res) => res.send('RulerCraft proxy running. Use /markers'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Listening on', PORT));
