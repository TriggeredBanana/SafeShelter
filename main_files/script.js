const map = L.map('map').setView([58.1599, 8.0182], 13); 

// Legg til bakgrunnskart (fra OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


//Funksjon for å hente koordinater fra geometry objekt
function extractCoordinates(geom) {
    console.log('Geometry object:', geom);

    if (geom && geom.type === "Point" && Array.isArray(geom.coordinates)) {
        const [latitude, longitude] = geom.coordinates;
        return { latitude, longitude };
    }
    console.warn('Invalid geom object:', geom);
    return null;
}

// Hent tilfluktsrom fra databasen via backend-server (lokalt)
async function hentTilfluktsrom() {
    try {
        const response = await fetch("http://localhost:5000/api/tilfluktsrom");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const tilfluktsrom = await response.json();
        console.log('Tilfluktsrom data:', tilfluktsrom);

        // Legg til punkter på kartet
        tilfluktsrom.forEach(shelter => {
            const coordinates = extractCoordinates(shelter.geom);
            if (coordinates && shelter.adresse) {
                L.marker([coordinates.longitude, coordinates.latitude])
                 .addTo(map)
                 .bindPopup(`<b>Adresse:</b> ${shelter.adresse}<br><b>Plasser:</b> ${shelter.plasser}`);
            }
        });
    } catch (error) {
        console.error('Error fetching shelters:', error);
    }
}

// Kjør funksjonen
hentTilfluktsrom();