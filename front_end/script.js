const map = L.map('map').setView([59.9139, 10.7522], 12); 

// Legg til bakgrunnskart (fra OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Supabase API-info
const SUPABASE_URL = "DIN_SUPABASE_URL";
const SUPABASE_KEY = "DIN_SUPABASE_KEY";

// Hent tilfluktsrom fra databasen
async function hentTilfluktsrom() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/shelters`, {
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`
        }
    });

    const tilfluktsrom = await response.json();
    
    // Legg til punkter på kartet
    tilfluktsrom.forEach(shelter => {
        L.marker([shelter.latitude, shelter.longitude])
         .addTo(map)
         .bindPopup(`<b>${shelter.name}</b>`);
    });
}

// Kjør funksjonen
hentTilfluktsrom();
