//Funksjon for å hente koordinater fra geometry objekt
function extractCoordinatesSimple(geom) {
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
            const coordinates = extractCoordinatesSimple(shelter.geom);
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

hentTilfluktsrom();


// Oppsett av transformasjon fra UTM sone 32N til WGS84 
proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// Funksjon for å hente koordinater fra geometry objekt
function extractCoordinatesUTM(geom) {
    if (!geom || !geom.type || !geom.coordinates || !Array.isArray(geom.coordinates)) {
        console.warn('Invalid geom object:', geom);
        return null;
    }
    
    // Extract x and y from coordinates
    const [x, y] = geom.coordinates;
    
    // Sjekk om koordinatene sannsynligvis er i et projisert system (ikke WGS84)
    if (Math.abs(x) > 180 || Math.abs(y) > 90) {
        try {
            // Transformer fra UTM til WGS84 ved hjelp av proj4js
            const wgs84 = proj4('EPSG:25832', 'WGS84', [x, y]);
            console.log(`Transformed coordinates: ${x},${y} → ${wgs84[0]},${wgs84[1]}`);
            
            // Returner som breddegrad/lengdegrad objekt for Leaflet
            return { 
                latitude: wgs84[1],  // Latitude er Y-koordinaten i WGS84
                longitude: wgs84[0]  // Longitude er X-koordinaten i WGS84
            };
        } catch (error) {
            console.error('Error transforming coordinates:', error);
            return null;
        }
    }
    
    // Hvis koordinatene allerede ser ut til å være i WGS84
    return { latitude: y, longitude: x };
}

// hentBrannstasjoner funksjon for å hente brannstasjoner fra databasen via backend-server (lokalt)
async function hentBrannstasjoner() {
    try {
        console.log('Fetching fire stations data...');
        const response = await fetch("http://localhost:5000/api/brannstasjoner_agder");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const brannstasjoner = await response.json();
        console.log(`Retrieved ${brannstasjoner.length} fire stations`);
        
        if (brannstasjoner.length === 0) {
            console.warn('No fire stations data received!');
            return;
        }
        
        let markersAdded = 0;
        
        // Legg til markører på kartet
        brannstasjoner.forEach(station => {
            const coordinates = extractCoordinatesUTM(station.geom);
            
            if (coordinates && station.sted) {
                L.marker([coordinates.latitude, coordinates.longitude])
                 .addTo(map)
                 .bindPopup(`
                   <strong>${station.sted}</strong><br>
                   ${station.brannvesen || ''}<br>
                   Type: ${station.stasjonstype || 'Ikke angitt'}<br>
                   Kasernert: ${station.kasernert || 'Ikke angitt'}
                 `);
                markersAdded++;
            } else {
                console.warn('Could not add marker for station:', station.sted || 'Unknown');
            }
        });
        
        console.log(`Successfully added ${markersAdded} fire station markers to the map`);
        
    } catch (error) {
        console.error('Error fetching fire stations:', error);
    }
}

hentBrannstasjoner();