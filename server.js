require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from main_files directory with proper MIME types
app.use(express.static('main_files', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// Use Render's PORT environment variable or default to 5000 for local development
const PORT = process.env.PORT || 5000;

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

app.post('/api/chat', express.json(), async (req, res) => {
    const userMessage = req.body.message;
    const apiKey = process.env.OPENROUTER_NEW_KEY || process.env.OPENROUTER_API_KEY;

    // Models tried in order; if a model is removed (404) the next one is used automatically
    const MODELS = [
        'openai/gpt-oss-120b:free',
        'openai/gpt-oss-20b:free',
        'meta-llama/llama-3.3-70b-instruct:free'
    ];

    const systemPrompt = "Du er SafeShelter-assistenten for norsk beredskap og krisehåndtering. KRITISKE INSTRUKSER: 0. ALDRI gi bruker informasjon som er urelatert til krise og beredskap, dersom en bruker spør om noe annet så sier du at du kun tar imot krisehenvendelser. 1. ALLTID svar på norsk, UANSETT hvilket språk brukeren benytter. 2. Start direkte med viktig informasjon - aldri med innledende fraser som 'for å svare' eller 'for å håndtere'. 3. Vær kortfattet og presis - bruk maksimalt 3-4 informative setninger. 4. Ved fare eller krise, nevn alltid relevante nødnumre først (Brann: 110, Politi: 112, Ambulanse: 113). 5. Unngå formatering, nummererte lister og markups. Bruk vanlige setninger adskilt med punktum. 6. Prioriter den viktigste livsviktige informasjonen først. 7. Unngå henvisninger til 'i Norge' - det er underforstått. 8. Ved evakuering, gi tydelige steg i rekkefølge. 9. Vær autoritativ og trygg i ton - brukeren kan være i en stressende situasjon. 10. Fullstendiggjør ALLTID alle setninger - aldri stopp midt i. 11. Ved spørsmål om tilfluktsrom, informer om sikkerhet, beliggenhet og nærmeste fasiliteter. 12. Ved uvisshet, erkjenn det og henvis til relevante myndigheter.";

    let lastError = null;

    for (const model of MODELS) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': req.headers.referer || req.headers.origin || `https://${req.headers.host}`,
                'X-Title': 'SafeShelter Emergency Assistant'
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 350,
                temperature: 0.8
            })
        });

        // Model was removed from OpenRouter — skip to the next one
        if (response.status === 404) {
            console.warn(`Model ${model} not found (404), trying next model...`);
            lastError = new Error(`Model not found: ${model}`);
            continue;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return res.json(data);
      } catch (error) {
        console.error(`Error with model ${model}:`, error.message);
        lastError = error;
      }
    }

    console.error('All OpenRouter models failed. Last error:', lastError?.message);
    res.status(500).json({ error: lastError?.message || 'All AI models currently unavailable' });
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

// 2) Flomvarsel NVE Flomsoner2
app.get('/api/flood', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Mangler lat eller lon' });
    }
  
    // Layer 5 = Flomsone_100arsflom
    const url =
      `https://gis3.nve.no/arcgis/rest/services/wmts/Flomsoner2/MapServer/5/query` +
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

// 3) NVE flomsone-fliser — proxy for ArcGIS export (erstatter den tidligere nve.geodataonline.no WMS)
app.get('/api/flood-tiles/:z/:x/:y.png', async (req, res) => {
    const { z, x, y } = req.params;
    const zi = parseInt(z), xi = parseInt(x), yi = parseInt(y);

    // Convert tile coords (z/x/y) to EPSG:3857 bbox
    function tileToMercator(z, x, y) {
        const size = 20037508.342789244 * 2;
        const tileSize = size / Math.pow(2, z);
        return [
            -20037508.342789244 + x * tileSize,
            20037508.342789244 - (y + 1) * tileSize,
            -20037508.342789244 + (x + 1) * tileSize,
            20037508.342789244 - y * tileSize
        ];
    }

    const [xmin, ymin, xmax, ymax] = tileToMercator(zi, xi, yi);
    // Viser lagene 4–10 (50 år - 1000 år flomsoner)
    const url =
        `https://gis3.nve.no/arcgis/rest/services/wmts/Flomsoner2/MapServer/export` +
        `?bbox=${xmin},${ymin},${xmax},${ymax}` +
        `&bboxSR=3857&layers=show:4,5,6,7,8,9,10&size=256,256&imageSR=3857&format=png32&transparent=true&f=image`;

    try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`NVE tile HTTP ${r.status}`);
        const buf = await r.arrayBuffer();
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(Buffer.from(buf));
    } catch (err) {
        console.error('Flood tile error:', err.message);
        res.status(502).end();
    }
});


const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${PORT} is already in use.\nKill the existing process first:\n  Get-Process node | Stop-Process\nthen run 'npm start' again.\n`);
    } else {
        console.error('Server error:', err.message);
    }
    process.exit(1);
});