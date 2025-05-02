require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 5000;

app.get('/api/tilfluktsrom_agder', async (req, res) => {
    try {
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/tilfluktsrom_agder`, {
            headers: {
                "apikey": process.env.SUPABASE_KEY,
                "Authorization": `Bearer ${process.env.SUPABASE_KEY}`
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/brannstasjoner_agder', async (req, res) => {
    try {
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/brannstasjoner_agder`, {
            headers: {
                "apikey": process.env.SUPABASE_KEY,
                "Authorization": `Bearer ${process.env.SUPABASE_KEY}`
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 1) Vær (MET LocationForecast v2)
app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Mangler lat eller lon' });
    }
  
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
    console.log('MET-URL:', url);
  
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'SafeShelter/1.0 demo@eksempel.no' }
      });
      if (!r.ok) throw new Error(`MET feilet med status ${r.status}`);
      const json = await r.json();
      res.json(json);
    } catch (e) {
      console.error('MET error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

// 2) Flomvarsel (NVE WMS GetFeatureInfo)
app.get('/api/flood', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Mangler lat eller lon' });
    }
  
    const url =
      `https://nve.geodataonline.no/arcgis/rest/services/FlomAktsomhet/MapServer/0/query` +
      `?geometry=${lon},${lat}` +
      `&geometryType=esriGeometryPoint` +
      `&inSR=4326&outFields=*&outSR=4326&f=json`;
  
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      res.json({
        active: Array.isArray(json.features) && json.features.length > 0,
        count: json.features.length
      });
    } catch (err) {
      console.error('Flood API error:', err);
      res.status(500).json({ error: err.message });
    }
  });


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));