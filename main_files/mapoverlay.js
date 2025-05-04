/**
 * SafeShelter - Kartkontroller
 * Håndterer kartinitialisering og interaktive kartfunksjoner
 */

// Globale variabler for karttilgang fra andre skript
let map;
let searchMarkers;
let floodZoneLayer; // Legger til variabel for flomsoner

// Initialiser når DOM er lastet
document.addEventListener('DOMContentLoaded', function () {
    initializeMap();
    setupEventListeners();
});

// Initialiser kart sentrert på Kristiansand-området
function initializeMap() {
    map = L.map('map', {
        fadeAnimation: true,
        zoomAnimation: true
    }).setView([58.1599, 8.0182], 13);

    window.map = map;
    
    // Oppretter utvalg av kart
    const streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
    });

    // Lagre basislag for stilbytting
    window.baseLayers = {
        streets: streetsLayer,
        satellite: satelliteLayer,
        terrain: terrainLayer
    };

    // Legg til laggrupper for markører
    window.shelterLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50
    }).addTo(map);

    window.fireStationLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60
    }).addTo(map);

    window.sykehusLayer = L.geoJSON(null, {
        pointToLayer: (feature, latlng) => L.marker(latlng, {
            icon: L.divIcon({
                html: '<div class="hospital-marker-icon"><i class="fas fa-hospital"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30],
                className: ''
            })
        }),
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`
                <div class="location-popup">
                    <h4>Sykehus</h4>
                    <div class="popup-detail">
                        <i class="fas fa-hospital"></i>
                        <span>${feature.properties.name}</span>
                    </div>
                    <div class="popup-actions">
                        <button onclick="getDirectionsToLocation(
                            ${layer.getLatLng().lat}, 
                            ${layer.getLatLng().lng}, 
                            'Sykehus: ${feature.properties.name.replace(/'/g, "\\'")}'
                        )">
                            <i class="fas fa-route"></i> Få veibeskrivelse
                        </button>
                    </div>
                </div>
            `);
        }
    }).addTo(map);


    // Oppretter flomsonelag fra NVE WMS-tjeneste
    const floodZoneLayer = L.tileLayer.wms("https://nve.geodataonline.no/arcgis/services/FlomAktsomhet/MapServer/WmsServer", {
        layers: "Flom_aktsomhetsomrade",
        styles: "",
        format: "image/png",
        transparent: true,
        crs: L.CRS.EPSG3857, // Leaflet bruker EPSG:3857
        attribution: "Kartdata: © NVE"
    });

    // Sett floodZoneLayer globalt tilgjengelig
    window.floodZoneLayer = floodZoneLayer;

    // Lag for søkeresultater
    searchMarkers = L.layerGroup().addTo(map);

    // Skala-kontroll
    L.control.scale({
        imperial: false,
        position: 'bottomleft'
    }).addTo(map);

    // Opprett egendefinerte ikoner
    window.shelterIcon = L.divIcon({
        html: '<div class="shelter-marker-icon"><i class="fas fa-home"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
        className: ''
    });

    window.fireStationIcon = L.divIcon({
        html: '<div class="fire-marker-icon"><i class="fas fa-fire"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
        className: ''
    });

    showWelcomePulse();

    setTimeout(() => {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }, 1000);
}

// Toggle funksjonalitet for kart og stiler
function setupEventListeners() {

    document.getElementById('toggle-shelters').addEventListener('click', function () {
        this.classList.toggle('active');
        if (this.classList.contains('active')) {
            map.addLayer(window.shelterLayer);
        } else {
            map.removeLayer(window.shelterLayer);
        }
    });

    document.getElementById('toggle-firestations').addEventListener('click', function () {
        this.classList.toggle('fire-active');
        if (this.classList.contains('fire-active')) {
            map.addLayer(window.fireStationLayer);
        } else {
            map.removeLayer(window.fireStationLayer);
        }
    });

    document.getElementById("toggle-hospitals")
        .addEventListener("click", function () {
            this.classList.toggle("hospital-active");
            if (this.classList.contains("hospital-active")) {
                map.addLayer(window.sykehusLayer);
            } else {
                map.removeLayer(window.sykehusLayer);
            }
        });

    // Implementerer toggle-funksjonalitet for flomsoner
    document.getElementById('toggle-flood-zones').addEventListener('click', function () {
        this.classList.toggle('flood-active');
        if (this.classList.contains('flood-active')) {
            if (window.floodZoneLayer) {
                map.addLayer(window.floodZoneLayer);
            }
        } else {
            if (window.floodZoneLayer) {
                map.removeLayer(window.floodZoneLayer);
            }
        }
    });

    // Kartstilvelger
    document.querySelectorAll('.map-style').forEach(button => {
        button.addEventListener('click', function () {
            const selectedStyle = this.getAttribute('data-style');
            changeMapStyle(selectedStyle);

            // Oppdater aktiv knapp
            document.querySelectorAll('.map-style').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Søkefunksjonalitet
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');

    searchInput.addEventListener('input', debounce(async () => {
        if (searchInput.value.length >= 3) {
            const suggestions = await fetchLocationSuggestions(searchInput.value);
            displaySearchSuggestions(suggestions);
        }
    }, 300));

    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') searchLocation(searchInput.value);
    });

    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchMarkers.clearLayers();
        document.getElementById('search-suggestions').style.display = 'none';
    });

    // Finn nærmeste tilfluktsrom-knapp
    const findNearestBtn = document.getElementById('find-nearest');
    if (findNearestBtn) {
        findNearestBtn.addEventListener('click', findNearestShelter);
    }

    // Finn nærmeste brannstasjon-knapp
    const findNearestStationBtn = document.getElementById('find-nearest-station');
    if (findNearestStationBtn) {
        findNearestStationBtn.addEventListener('click', findNearestFireStation);
    }

    // etter findNearestFireStation…
    const findNearestHospitalBtn = document.getElementById('find-nearest-hospital');
    if (findNearestHospitalBtn) {
        findNearestHospitalBtn.addEventListener('click', findNearestHospital);
    }

    // Håndter vindustørrelsesendring
    window.addEventListener('resize', () => map.invalidateSize())

}

// Endre kartstil
function changeMapStyle(style) {
    // Fjern først alle basislag ved å spore hvilket som er aktivt
    map.eachLayer(function (layer) {
        // Sjekk om dette er et flisslag (basiskart)
        if (layer._url && layer._url.includes('tile')) {
            map.removeLayer(layer);
        }
    });

    // Legg til det valgte laget som en ny instans
    let newBaseLayer;

    switch (style) {
        case 'satellite':
            newBaseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });
            break;
        case 'terrain':
            newBaseLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
            });
            break;
        case 'streets':
        default:
            newBaseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            });
            break;
    }

    // Legg til det nye basislaget og sørg for at det er nederst
    newBaseLayer.addTo(map);
    newBaseLayer.bringToBack();

    // Oppdater vår referanse til dette stilens lag
    window.baseLayers[style] = newBaseLayer;

    // Vis varsling
    showNotification(`Kartstil endret til ${style}`);
}

// Vis velkomstpulsanimasjon
function showWelcomePulse() {
    const pulseStyle = document.createElement('style');
    pulseStyle.textContent = `
        .map-pulse {
            border-radius: 50%;
            height: 100%;
            width: 100%;
            background: rgba(255, 209, 102, 0.6);
            box-shadow: 0 0 0 0 rgba(255, 209, 102, 0.5);
            transform: scale(0.8);
            animation: pulse-ring 2s infinite;
        }
        
        @keyframes pulse-ring {
            0% { transform: scale(0.5); opacity: 1; }
            70% { transform: scale(2); opacity: 0; }
            100% { transform: scale(0.5); opacity: 0; }
        }
        
        .shelter-marker-icon, .fire-marker-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            border-radius: 50%;
        }
        
        .shelter-marker-icon {
            background-color: var(--primary);
            color: white;
        }
        
        .fire-marker-icon {
            background-color: var(--warning);
            color: white;
        }

        .distance-marker {
            background-color: white;
            border: 2px solid #0466c8;
            color: #0466c8;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 12px;
            white-space: nowrap;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 150px;
        }
    `;
    document.head.appendChild(pulseStyle);

    const pulseIcon = L.divIcon({
        html: '<div class="map-pulse"></div>',
        className: '',
        iconSize: [70, 70]
    });

    const center = map.getCenter();
    const pulseMarker = L.marker([center.lat, center.lng], {
        icon: pulseIcon,
        zIndexOffset: -1000
    }).addTo(map);

    setTimeout(() => map.removeLayer(pulseMarker), 2500);
}

// Finn nærmeste tilfluktsrom ved hjelp av nettleser-geolokalisering
function findNearestShelter() {
    showNotification("Finner din posisjon...", "info");

    if (!navigator.geolocation) {
        showNotification("Geolokalisering støttes ikke av din nettleser", "error");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // Fjern tidligere markører
            searchMarkers.clearLayers();

            // Legg til brukerposisjonsmarkør
            const userMarker = createUserPositionMarker(userLat, userLng)
                .addTo(searchMarkers)
                .openPopup();
            
            showNotification("Posisjon funnet! Finner nærmeste tilfluktsrom...", "suksess");

            // Finn nærmeste tilfluktsrom ved å beregne avstander
            findNearest(userLat, userLng);
        },
        // Feil - callback
        function (error) {
            console.error("Geolokaliseringsfeil:", error);
            let errorMsg;

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = "Posisjonstilgang nektet. Vennligst aktiver posisjonstjenester.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = "Posisjonsinformasjon er utilgjengelig.";
                    break;
                case error.TIMEOUT:
                    errorMsg = "Forespørsel om posisjon tidsavbrutt.";
                    break;
                default:
                    errorMsg = "En ukjent feil oppstod under henting av posisjon.";
            }

            showNotification(errorMsg, "error");
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function findNearestFireStation() {
    showNotification("Finner din posisjon...", "info");

    if (!navigator.geolocation) {
        showNotification("Geolokalisering støttes ikke av din nettleser", "error");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // Fjern tidligere markører
            searchMarkers.clearLayers();

            // Legg til brukerposisjonsmarkør
            const userMarker = createUserPositionMarker(userLat, userLng)
                .addTo(searchMarkers)
                .openPopup();

            showNotification("Posisjon funnet! Finner nærmeste brannstasjon...", "suksess");

            // Finn nærmeste brannstasjon
            findNearestStation(userLat, userLng);
        },
        function (error) {
            console.error("Geolokaliseringsfeil:", error);
            showNotification("Kunne ikke hente posisjon.", "error");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function findNearestHospital() {
    showNotification("Finner din posisjon...", "info");

    if (!navigator.geolocation) {
        showNotification("Geolokalisering støttes ikke av din nettleser", "error");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // Fjern tidligere markører
            searchMarkers.clearLayers();

            // Legg til brukerposisjonsmarkør
            const userMarker = createUserPositionMarker(userLat, userLng)
                .addTo(searchMarkers)
                .openPopup();
            
            showNotification("Posisjon funnet! Finner nærmeste sykehus...", "success");

            // Finn nærmeste sykehus ved å beregne avstander
            if (!window.sykehusLayer || window.sykehusLayer.getLayers().length === 0) {
                showNotification("Ingen sykehusdata tilgjengelig", "error");
                return;
            }

            let nearestHospital = null;
            let shortestDistance = Infinity;
            
            // Go through all hospital markers to find the nearest one
            window.sykehusLayer.eachLayer(function(layer) {
                const hospitalLat = layer.getLatLng().lat;
                const hospitalLng = layer.getLatLng().lng;
                
                // Calculate direct distance using the Haversine formula
                const directDistance = calculateDistance(userLat, userLng, hospitalLat, hospitalLng);
                
                // Update nearest hospital if this one is closer
                if (directDistance < shortestDistance) {
                    shortestDistance = directDistance;
                    nearestHospital = layer;
                }
            });
            
            if (nearestHospital) {
                const hospitalLat = nearestHospital.getLatLng().lat;
                const hospitalLng = nearestHospital.getLatLng().lng;
                
                // Show notification about finding nearest hospital
                showNotification("Nærmeste sykehus funnet!", "success");
                
                // Extract hospital name from popup content if available
                const hospitalName = nearestHospital.getPopup() ? 
                    (nearestHospital.getPopup().getContent().match(/<strong>(.*?)<\/strong>/) || ['', 'Sykehus'])[1] : 
                    'Sykehus';
                
                // Create mode selector for driving/walking
                createTravelModeSelector(userLat, userLng, hospitalLat, hospitalLng, hospitalName);
                
                // Get route for driving first (default)
                getRouteWithMode(userLat, userLng, hospitalLat, hospitalLng, hospitalName, "driving");
                
                // Open the popup for the nearest hospital
                nearestHospital.openPopup();
            } else {
                showNotification("Ingen sykehus funnet i nærheten", "warning");
            }
        },
        function(error) {
            console.error("Geolokaliseringsfeil:", error);
            let errorMsg = "Kunne ikke hente din posisjon. Vennligst sjekk at lokasjonstjenester er aktivert.";
            showNotification(errorMsg, "error");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}
  

// Finn nærmeste tilfluktsrom ved å beregne avstander
function findNearest(userLat, userLng) {
    // First check if we have shelter data loaded
    if (!window.shelterLayer || window.shelterLayer.getLayers().length === 0) {
        showNotification("Ingen tilfluktsromdata tilgjengelig", "error");
        return;
    }

    let nearestShelter = null;
    let shortestDistance = Infinity;
    
    // Go through all shelter markers to find the nearest one
    window.shelterLayer.eachLayer(function(layer) {
        // Get shelter position from the marker
        const shelterLat = layer.getLatLng().lat;
        const shelterLng = layer.getLatLng().lng;
        
        // Calculate direct distance using the "Haversine formula"
        const directDistance = calculateDistance(userLat, userLng, shelterLat, shelterLng);
        
        // Update nearest shelter if this one is closer
        if (directDistance < shortestDistance) {
            shortestDistance = directDistance;
            nearestShelter = layer;
        }
    });
    
    // If a nearest shelter is found, highlight it and show travel mode options
    if (nearestShelter) {
        const shelterLat = nearestShelter.getLatLng().lat;
        const shelterLng = nearestShelter.getLatLng().lng;
        
        // Show notification about finding nearest shelter
        showNotification("Nærmeste tilfluktsrom funnet!", "success");
        
        // Fjern tidligere markører
        searchMarkers.clearLayers();

        // Legg til brukerposisjonsmarkør
        const userMarker = createUserPositionMarker(userLat, userLng)
            .addTo(searchMarkers)
            .openPopup();
        
        const shelterName = nearestShelter.getPopup() ? 
            (nearestShelter.getPopup().getContent().match(/<h4>(.*?)<\/h4>/) || ['', 'Tilfluktsrom'])[1] : 
            'Tilfluktsrom';
        
        // Create mode selector for driving/walking
        createTravelModeSelector(userLat, userLng, shelterLat, shelterLng, shelterName);
        
        // Get route for driving first (default)
        getRouteWithMode(userLat, userLng, shelterLat, shelterLng, shelterName, "driving");
        
        // Open the popup for the nearest shelter
        nearestShelter.openPopup();
        
        // Trigger click on the nearest shelter to show details in sidebar
        nearestShelter.fire('click');
        
    } else {
        showNotification("Ingen tilfluktsrom funnet i nærheten", "warning");
    }
}

function findNearestStation(userLat, userLng) {
    if (!window.fireStationLayer || window.fireStationLayer.getLayers().length === 0) {
        showNotification("Ingen brannstasjonsdata tilgjengelig", "error");
        return;
    }

    let nearestStation = null;
    let shortestDistance = Infinity;

    // Go through all fire station markers to find the nearest one
    window.fireStationLayer.eachLayer(function(layer) {
        const stationLat = layer.getLatLng().lat;
        const stationLng = layer.getLatLng().lng;
        const directDistance = calculateDistance(userLat, userLng, stationLat, stationLng);

        if (directDistance < shortestDistance) {
            shortestDistance = directDistance;
            nearestStation = layer;
        }
    });

    if (nearestStation) {
        const stationLat = nearestStation.getLatLng().lat;
        const stationLng = nearestStation.getLatLng().lng;

        // Show notification about finding nearest fire station
        showNotification("Nærmeste brannstasjon funnet!", "success");
        
        // Fjern tidligere markører
        searchMarkers.clearLayers();

        // Legg til brukerposisjonsmarkør
        const userMarker = createUserPositionMarker(userLat, userLng)
            .addTo(searchMarkers)
            .openPopup();
                
        // Extract station name from popup content if available
        const stationName = nearestStation.getPopup() ? 
            (nearestStation.getPopup().getContent().match(/<h4>Brannstasjon: (.*?)<\/h4>/) || ['', 'Brannstasjon'])[1] : 
            'Brannstasjon';
        
        // Create mode selector for driving/walking
        createTravelModeSelector(userLat, userLng, stationLat, stationLng, stationName);
        
        // Get route for driving first (default)
        getRouteWithMode(userLat, userLng, stationLat, stationLng, stationName, "driving");
        
        // Open the popup for the nearest station
        nearestStation.openPopup();
        
        // Trigger click on the nearest station to show details in sidebar
        nearestStation.fire('click');
        
    } else {
        showNotification("Ingen brannstasjoner funnet i nærheten", "warning");
    }
}

// Get directions to selected location
function getDirectionsToLocation(destLat, destLng, destName) {
    showNotification("Finner din posisjon...", "info");
    
    if (!navigator.geolocation) {
        showNotification("Geolokalisering støttes ikke av din nettleser", "error");
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Fjern tidligere markører
            searchMarkers.clearLayers();

            // Legg til brukerposisjonsmarkør
            const userMarker = createUserPositionMarker(userLat, userLng)
                .addTo(searchMarkers)
                .openPopup();
            
            showNotification("Beregner rute...", "info");
            
            // Create mode selector
            createTravelModeSelector(userLat, userLng, destLat, destLng, destName);
            
            // Get route for driving first (default)
            getRouteWithMode(userLat, userLng, destLat, destLng, destName, "driving");
        },
        function(error) {
            console.error("Geolokaliseringsfeil:", error);
            showNotification("Kunne ikke hente posisjon.", "error");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Create travel mode selector UI
function createTravelModeSelector(userLat, userLng, destLat, destLng, destName) {
    // Remove existing mode selector if any
    const existingSelector = document.getElementById('travel-mode-selector');
    if (existingSelector) {
        existingSelector.remove();
    }
    
    // Create mode selector container
    const modeSelector = document.createElement('div');
    modeSelector.id = 'travel-mode-selector';
    modeSelector.className = 'travel-mode-selector';
    modeSelector.innerHTML = `
        <div class="modern-directions-layout">
            <div class="directions-header">
                <h4>Veibeskrivelse</h4>
                <div class="mode-toggles">
                    <button id="mode-driving" class="mode-toggle active">
                        <i class="fas fa-car"></i>
                    </button>
                    <button id="mode-walking" class="mode-toggle">
                        <i class="fas fa-walking"></i>
                    </button>
                </div>
                <button id="close-directions" class="close-directions" title="Lukk veibeskrivelse">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="route-info" class="route-info"></div>
        </div>
    `;
    
    // Add to map
    document.querySelector('.map-container').appendChild(modeSelector);
    
    // Add event listeners
    document.getElementById('mode-driving').addEventListener('click', function() {
        document.querySelectorAll('.mode-toggle').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        getRouteWithMode(userLat, userLng, destLat, destLng, destName, "driving");
    });
    
    document.getElementById('mode-walking').addEventListener('click', function() {
        document.querySelectorAll('.mode-toggle').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        getRouteWithMode(userLat, userLng, destLat, destLng, destName, "walking");
    });
    
    // Add close button event listener
    document.getElementById('close-directions').addEventListener('click', function() {
        closeDirectionsView();
    });
}

// Get route with specified travel mode
function getRouteWithMode(startLat, startLng, endLat, endLng, destName, mode) {
    // Clear any existing routes
    searchMarkers.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
            searchMarkers.removeLayer(layer);
        }
    });
    
    // Get the route info element
    const routeInfoEl = document.getElementById('route-info');
    
    // Create loading overlay instead of replacing content
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'route-loading';
    loadingOverlay.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i> Beregner ${mode === 'driving' ? 'kjøre' : 'gange'}rute...
    `;
    
    // Add loading overlay
    routeInfoEl.appendChild(loadingOverlay);
    
    // Update active styling for mode buttons
    document.querySelectorAll('.mode-toggle').forEach(btn => {
        if (btn.id === `mode-${mode}`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Get route data from OSRM
    const profile = mode === 'driving' ? 'driving' : 'foot';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const distanceKm = (route.distance / 1000).toFixed(2);
                const distanceText = distanceKm > 1 ? `${distanceKm} km` : `${Math.round(route.distance)} m`;
                
                // Calculate appropriate duration based on mode
                let durationMinutes;
                if (mode === 'driving') {
                    durationMinutes = Math.round(route.duration / 60);
                } else {
                    // Average walking speed is about 5km/h
                    durationMinutes = Math.round((route.distance / 1000) / 5 * 60);
                }
                
                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;
                let durationText = '';
                
                if (hours > 0) {
                    durationText = `${hours} t ${minutes} min`;
                } else {
                    durationText = `${minutes} min`;
                }
                
                // Draw the route
                const routeLine = L.geoJSON(route.geometry, {
                    style: {
                        color: mode === 'driving' ? '#0466c8' : '#d64045',
                        weight: 5,
                        opacity: 0.7,
                        lineCap: 'round'
                    }
                }).addTo(searchMarkers);
                
                // Remove any existing loading indicator
                const existingLoader = document.querySelector('.route-loading');
                if (existingLoader) {
                    existingLoader.remove();
                }

                // Update route info with smooth animation
                const routeInfoEl = document.getElementById('route-info');
                const routeDetails = document.createElement('div');
                routeDetails.className = 'route-details';
                routeDetails.innerHTML = `
                    <div class="route-destination">
                    <i class="fas fa-map-marker-alt"></i> ${destName} </div>
                    <div class="route-stats">
                        <span><i class="fas fa-ruler"></i> Avstand: ${distanceText}</span>
                        <span><i class="fas fa-clock"></i> Estimert tid: ${durationText}</span>
                    </div>
                `;

                // Remove any existing details before adding new ones
                const existingDetails = routeInfoEl.querySelector('.route-details');
                if (existingDetails) {
                    existingDetails.remove();
                }

                routeInfoEl.appendChild(routeDetails);
                
                // Fit map to show the route
                map.fitBounds(routeLine.getBounds(), {
                    padding: [50, 50],
                    maxZoom: 15
                });
                
                showNotification(`Rute beregnet: ${distanceText}, ca. ${durationText} med ${mode === 'driving' ? 'bil' : 'gange'}`, "success");
            } else {
                throw new Error('No route found');
            }
        })
        .catch(error => {
            console.error('Error fetching route:', error);
            showNotification("Kunne ikke beregne rute. Prøv en annen transportmetode.", "error");
            document.getElementById('route-info').innerHTML = `
                <div class="route-error">
                    <i class="fas fa-exclamation-triangle"></i> Kunne ikke beregne rute.
                </div>
            `;
        });
}

// Close directions view and clean up
function closeDirectionsView() {
    // Remove travel mode selector
    const selector = document.getElementById('travel-mode-selector');
    if (selector) {
        selector.remove();
    }
    
    // Clear any routes and markers from search layer
    searchMarkers.clearLayers();
    
    // Show success notification
    showNotification("Veibeskrivelse lukket", "info");
}

// Beregn avstand mellom to punkter ved hjelp av "Haversine-formelen"
function calculateDistance(lat1, lon1, lat2, lon2) {
    // Jordens radius i kilometer
    const R = 6371;

    // Konverter grader til radianer
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    // Haversine-formel
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;    
    return distance;
}

// Create a styled user position marker
function createUserPositionMarker(lat, lng) {
    const userIcon = L.divIcon({
        className: 'user-position-marker',
        html: '<div class="user-position-icon"><i class="fas fa-user"></i></div>',
        iconSize: [50, 60],
        iconAnchor: [25, 45], // Position in the middle horizontally and at the point of the arrow
        popupAnchor: [-7, -50] // Position popup above the icon
    });
    
    return L.marker([lat, lng], {
        icon: userIcon,
        zIndexOffset: 1000 // Ensure user marker appears above other markers
    }).bindPopup('<strong>Din posisjon</strong>');
}

// Hent posisjonsforslag fra OpenStreetMap
async function fetchLocationSuggestions(query) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        if (!response.ok) throw new Error(`HTTP-feil: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Søkeforslagsfeil:', error);
        return [];
    }
}

// Vis søkeforslag-nedtrekksmeny
function displaySearchSuggestions(results) {
    const container = document.getElementById('search-suggestions');
    container.innerHTML = '';

    if (results.length === 0) {
        container.style.display = 'none';
        return;
    }

    results.forEach(result => {
        const item = document.createElement('li');
        item.className = 'search-suggestion-item';
        item.textContent = result.display_name;

        item.addEventListener('click', () => {
            document.getElementById('search-input').value = result.display_name;
            container.style.display = 'none';
            searchLocation(result.display_name);
        });

        container.appendChild(item);
    });

    container.style.display = 'block';
}

// Søk etter en posisjon og vis den på kartet
async function searchLocation(query) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`HTTP-feil: ${response.status}`);

        const data = await response.json();

        if (data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);

            // Fjern tidligere søkemarkører
            searchMarkers.clearLayers();

            // Legg til markør for søkeresultat
            const marker = L.marker([lat, lon])
                .addTo(searchMarkers)
                .bindPopup(`<strong>${result.display_name}</strong>`)
                .openPopup();

            // Flytt kartet til søkeresultat
            map.flyTo([lat, lon], 14, {
                animate: true,
                duration: 1
            });

            showNotification("Posisjon funnet!", "suksess");
        } else {
            showNotification("Ingen resultater funnet for søket ditt", "warning");
        }
    } catch (error) {
        console.error('Søkefeil:', error);
        showNotification("Feil ved søk etter posisjon", "error");
    }
}

// Hjelpefunksjon for debouncing
function debounce(func, delay) {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Gjør kart og funksjoner tilgjengelig globalt
window.searchLocation = searchLocation;
window.findNearestShelter = findNearestShelter;
window.findNearestFireStation = findNearestFireStation;
window.findNearestHospital = findNearestHospital;
window.getDirectionsToLocation = getDirectionsToLocation;
window.closeDirectionsView = closeDirectionsView;
window.changeMapStyle = changeMapStyle;