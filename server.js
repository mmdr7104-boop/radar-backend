const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

let cache = { data: null, timestamp: 0 };
const CACHE_DURATION = 8000;

app.get('/planes', async (req, res) => {
    const lat = req.query.lat || '35.4011';
    const lng = req.query.lng || '35.9486';
    const radius = req.query.radius || '250';
    const nmRadius = Math.round(parseFloat(radius) * 0.539957);

    if (cache.data && (Date.now() - cache.timestamp < CACHE_DURATION)) {
        return res.json(cache.data);
    }
    try {
        const url = `https://opendata.adsb.fi/api/v2/point/${lat}/${lng}/${nmRadius}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (response.ok) {
            const data = await response.json();
            cache.data = data; cache.timestamp = Date.now();
            return res.json(data);
        }
        const fallbackUrl = `https://api.adsb.lol/v2/point/${lat}/${lng}/${nmRadius}`;
        const fbResponse = await fetch(fallbackUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (fbResponse.ok) {
            const fbData = await fbResponse.json();
            cache.data = fbData; cache.timestamp = Date.now();
            return res.json(fbData);
        }
        throw new Error('All sources failed');
    } catch (error) {
        if (cache.data) return res.json(cache.data);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => res.send('Radar Backend is running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
