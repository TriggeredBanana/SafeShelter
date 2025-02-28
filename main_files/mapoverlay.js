const map = L.map('map', {
    fadeAnimation: false,
    zoomAnimation: false
}).setView([58.1599, 8.0182], 13);

// Passer på at DOM er lastet inn før kartet vises
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        map.invalidateSize({animate: false});
    }, 500);
});

// Håndterer at kartet endrer vindusstørrelse greit
window.addEventListener('resize', function() {
    map.invalidateSize({animate: false});
});


// Legg til bakgrunnskart (fra OpenStreetMap)
const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


// Layer grupper for tilfluktsrom og brannstasjoner
const shelterLayer = L.layerGroup();
const fireStationLayer = L.layerGroup();


// Oppretter en LayerGroup for søkemarkører (røde markører)
const searchMarkers = L.layerGroup().addTo(map);


// Toggle knapp for lag - funksjonalitet
document.getElementById('toggle-shelters').addEventListener('click', function() {
    this.classList.toggle('active');
    if (map.hasLayer(shelterLayer)) {
        map.removeLayer(shelterLayer);
    } else {
        map.addLayer(shelterLayer);
    }
});

document.getElementById('toggle-firestations').addEventListener('click', function() {
    this.classList.toggle('active');
    if (map.hasLayer(fireStationLayer)) {
        map.removeLayer(fireStationLayer);
    } else {
        map.addLayer(fireStationLayer);
    }
});


// Søkefunksjonalitet
const searchInput = document.getElementById('search-input');
const searchSuggestions = document.getElementById('search-suggestions');
const searchButton = document.getElementById('search-button');

let debounceTimeout; // Timeout for debounce (for å hindre for mange API-kall)

// Definerer den røde markøren
const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', 
    iconSize: [25, 41], 
    iconAnchor: [12, 41], 
    popupAnchor: [1, -34], 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

// **DEBOUNCE-FUNKSJON** (Hindrer for mange API-kall)
function debounce(func, delay) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(func, delay);
}

// **Henter søkeresultater fra Nominatim (med debounce)**
async function getSearchSuggestions(query) {
    if (query.length < 3) { // Krever minst 3 tegn for å søke
        searchSuggestions.style.display = "none";
        return;
    }

    debounce(async () => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`);
            if (!response.ok) throw new Error(`HTTP-feil! Status: ${response.status}`);

            const data = await response.json();
            console.log("Søkeforslag:", data);

            if (data.length > 0) {
                showSearchSuggestions(data.slice(0, 5)); // **Viser maks 5 forslag**
            } else {
                searchSuggestions.style.display = "none";
            }
        } catch (error) {
            console.error("Feil ved henting av søkeforslag:", error);
        }
    }, 300); // **Forsinker API-kall med 300ms**
}

// **Viser søkeresultater i dropdown**
function showSearchSuggestions(results) {
    searchSuggestions.innerHTML = ""; // Tøm tidligere forslag

    results.forEach(result => {
        const listItem = document.createElement("li");
        listItem.textContent = result.display_name;
        listItem.classList.add("search-suggestion-item");

        listItem.addEventListener("click", () => {
            searchInput.value = result.display_name; // Setter valgt adresse i inputfeltet
            searchSuggestions.style.display = "none"; // Skjuler søkeresultater
            searchLocation(result.display_name); // Kjør søk på valgt adresse
        });

        searchSuggestions.appendChild(listItem);
    });

    searchSuggestions.style.display = "block"; // Gjør dropdownen synlig
}

// **Søker etter en lokasjon på kartet**
async function searchLocation(query) {
    console.log('Søker etter:', query);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`HTTP-feil! Status: ${response.status}`);

        const data = await response.json();
        console.log('Søkeresultater:', data);

        if (data.length > 0) {
            const firstResult = data[0];
            const lat = parseFloat(firstResult.lat);
            const lon = parseFloat(firstResult.lon);

            map.setView([lat, lon], 13);

            searchMarkers.clearLayers();
            const marker = L.marker([lat, lon], { icon: redIcon })
                .bindPopup(`<b>${firstResult.display_name}</b>`)
                .openPopup();
            
            searchMarkers.addLayer(marker);
        } else {
            alert('Lokasjon ikke funnet. Prøv et annet søk.');
        }
    } catch (error) {
        console.error('Feil under søk etter lokasjon:', error);
        alert('Det oppstod en feil under søk. Prøv igjen.');
    }
}

// **📌 Event Listeners 📌**

// 🎯 **Lytter etter input i søkefeltet for å vise søkeresultater**
searchInput.addEventListener("input", () => {
    getSearchSuggestions(searchInput.value);
});

// 🎯 **Lytter etter klikk på siden for å skjule søkeresultatene når brukeren klikker utenfor**
document.addEventListener("click", (event) => {
    if (!searchInput.contains(event.target) && !searchSuggestions.contains(event.target)) {
        searchSuggestions.style.display = "none"; // Skjuler søkeresultater
    }
});

// 🎯 **Lytter etter klikk på søkeknappen for å søke på det som er skrevet i feltet**
searchButton.addEventListener("click", () => {
    searchLocation(searchInput.value);
});

// 🎯 **Lytter etter "Enter"-tasten for å starte søk**
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") { 
        searchLocation(searchInput.value);
    }
});