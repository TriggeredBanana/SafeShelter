require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

app.post('/api/chat', express.json(), async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': req.headers.referer || 'http://localhost:5000',
                'X-Title': 'SafeShelter Emergency Assistant'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-maverick:free",
                messages: [
                    {
                        role: "system",
                        content: "Du er SafeShelter-assistenten for norsk beredskap og krisehåndtering. KRITISKE INSTRUKSER: 1. ALLTID svar på norsk, UANSETT hvilket språk brukeren benytter. 2. Start direkte med viktig informasjon - aldri med innledende fraser som 'for å svare' eller 'for å håndtere'. 3. Vær kortfattet og presis - bruk maksimalt 3-4 informative setninger. 4. Ved fare eller krise, nevn alltid relevante nødnumre først (Brann: 110, Politi: 112, Ambulanse: 113). 5. Unngå formatering, nummererte lister og markups. Bruk vanlige setninger adskilt med punktum. 6. Prioriter den viktigste livsviktige informasjonen først. 7. Unngå henvisninger til 'i Norge' - det er underforstått. 8. Ved evakuering, gi tydelige steg i rekkefølge. 9. Vær autoritativ og trygg i ton - brukeren kan være i en stressende situasjon. 10. Fullstendiggjør ALLTID alle setninger - aldri stopp midt i. 11. Ved spørsmål om tilfluktsrom, informer om sikkerhet, beliggenhet og nærmeste fasiliteter. 12. Ved uvisshet, erkjenn det og henvis til relevante myndigheter."                       
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                max_tokens: 350,
                temperature: 0.8
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));