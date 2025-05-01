document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let reportsMap;
    let userPosition = null;
    let allReports = [];
    let reportMarkers = [];
    
    // DOM elements
    const reportsListContainer = document.getElementById('reports-list');
    const filterType = document.getElementById('filter-type');
    const filterSeverity = document.getElementById('filter-severity');
    const filterNearby = document.getElementById('filter-nearby');
    
    // Initialize the application
    initializeApp();
    
    // Main initialization function
    function initializeApp() {
        initializeReportsMap();
        setupEventListeners();
        loadExistingReports();
    }
    
    // Initialize the reports overview map
    function initializeReportsMap() {
        reportsMap = L.map('reports-map').setView([58.1599, 8.0182], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(reportsMap);
    }
    
    // Setup event listeners for user interaction
    function setupEventListeners() {
        // Filters
        filterType.addEventListener('change', filterReports);
        filterSeverity.addEventListener('change', filterReports);
        filterNearby.addEventListener('click', showNearbyReports);

        // Clear reports button
        const clearReportsBtn = document.getElementById('clear-reports');
        if (clearReportsBtn) {
            clearReportsBtn.addEventListener('click', function() {
                if (confirm('Er du sikker på at du vil fjerne alle lagrede rapporter? Denne handlingen kan ikke angres.')) {
                    localStorage.removeItem('safetyReports');
                    showNotification("Alle lagrede rapporter er fjernet", "info");
                    loadExistingReports(); // Reload the page with mock data only
                }
            });
        }
    }
    
    // Load existing reports (mock data for demo)
    function loadExistingReports() {
        // Show loading state
        reportsListContainer.innerHTML = `
            <div class="loading-reports">
                <div class="spinner"></div>
                <p>Laster inn rapporter...</p>
            </div>
        `;
        
        // Simulate API call delay
        setTimeout(() => {
            // Get submitted reports from localStorage
            const userSubmittedReports = JSON.parse(localStorage.getItem('safetyReports') || '[]');
            
            // Always generate mock reports (regardless of user submissions)
            const mockReports = generateMockReports();
            
            // Mark user reports for visual differentiation (optional)
            if (userSubmittedReports.length > 0) {
                userSubmittedReports.forEach(report => {
                    report.isUserSubmitted = true; // Add flag to identify user submissions
                });
            }
            
            // Combine user submitted reports with mock reports
            allReports = [...userSubmittedReports, ...mockReports];
            
            // Sort the reports by timestamp (newest first)
            allReports.sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return dateB - dateA; // Descending order (newest first)
            });
            
            // Display the reports
            displayReports(allReports);
            
            // Add reports to map
            allReports.forEach(report => addReportToMap(report));
            
            // Show an informative notification
            if (userSubmittedReports.length > 0) {
                showNotification(`Viser ${userSubmittedReports.length} brukerinnsendte og ${mockReports.length} genererte rapporter`, "success");
            } else {
                showNotification(`${mockReports.length} rapporter lastet`, "info");
            }
        }, 1500);
    }
    
    // Generate mock safety reports
    function generateMockReports() {
        const types = ['blocked-road', 'flooding', 'facility-issue', 'power-outage', 'hazard'];
        const severities = ['low', 'medium', 'high'];
        const baseLocation = { lat: 58.1599, lng: 8.0182 }; // Kristiansand
        
        const mockReports = [];
        
        // Generate more reports for better display
        for (let i = 0; i < 15; i++) {
            // Generate a location within ~5km of base location
            const lat = baseLocation.lat + (Math.random() - 0.5) * 0.1;
            const lng = baseLocation.lng + (Math.random() - 0.5) * 0.1;
            
            // Create mock report
            mockReports.push({
                id: 'SR-' + Math.floor(Math.random() * 100000),
                type: types[Math.floor(Math.random() * types.length)],
                severity: severities[Math.floor(Math.random() * severities.length)],
                description: getRandomDescription(types[Math.floor(Math.random() * types.length)]),
                location: {
                    lat: lat,
                    lng: lng,
                    address: `Nær ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                },
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)).toISOString(), // Within last week
                status: Math.random() > 0.2 ? 'active' : 'resolved',
                hasPhoto: Math.random() > 0.6
            });
        }
        
        return mockReports;
    }
    
    // Get a random description based on report type
    function getRandomDescription(type) {
        const descriptions = {
            'blocked-road': [
                'Vei blokkert av falt tre. Ikke mulig å passere med bil.',
                'Store vannmengder har oversvømt veien. Ufremkommelig.',
                'Steinras har blokkert hele veibanen. Anbefaler omvei.'
            ],
            'flooding': [
                'Vann stiger raskt i området. Første etasje oversvømt.',
                'Elven har gått over sine bredder. Flere hus evakuert.',
                'Kraftig flom i området. Ikke forsøk å krysse vannet med bil.'
            ],
            'facility-issue': [
                'Ingen strøm i tilfluktsrommet. Nødlys fungerer ikke.',
                'Inngangsdør til brannstasjonen er blokkert.',
                'Vannlekkasje i tilfluktsrommet, deler av rommet er utilgjengelig.'
            ],
            'power-outage': [
                'Strømbrudd i hele området. Har vart i over 3 timer.',
                'Transformator skadet av lyn. Reparasjon pågår.',
                'Flere strømledninger har falt ned. Hold avstand!'
            ],
            'hazard': [
                'Giftig utslipp fra fabrikken. Hold vinduer lukket.',
                'Ustabilt jordsmonn etter kraftig regn. Fare for ras.',
                'Is på veien gjør kjøreforholdene svært farlige.'
            ]
        };
        
        const typeDescriptions = descriptions[type] || descriptions['hazard'];
        return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
    }
    
    // Display the reports in the list
    function displayReports(reports) {
        const activeReports = reports.filter(report => report.status === 'active');
        
        if (activeReports.length === 0) {
            reportsListContainer.innerHTML = `
                <div class="no-reports">
                    <i class="fas fa-info-circle"></i>
                    <p>Ingen rapporter funnet med valgte filtre.</p>
                </div>
            `;
            return;
        }
        
        // Clear container
        reportsListContainer.innerHTML = '';
        
        // Add each report card
        activeReports.forEach((report, index) => {
            // Format timestamp to Norwegian locale
            const reportDate = new Date(report.timestamp);
            const formattedDate = reportDate.toLocaleString('no-NO', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Get icon based on report type
            const typeIcon = getReportTypeIcon(report.type);
            
            // Create report card
            const reportCard = document.createElement('div');
            reportCard.className = `report-card severity-${report.severity}`;
            
            // Add user-submitted class if applicable
            if (report.isUserSubmitted) {
                reportCard.classList.add('user-submitted');
            }
            
            reportCard.dataset.reportId = report.id;
            reportCard.style.animationDelay = `${index * 0.1}s`;
            
            reportCard.innerHTML = `
                <div class="report-header">
                    <div class="report-type">
                        <i class="${typeIcon}"></i>
                        <span>${getReportTypeName(report.type)}</span>
                    </div>
                    <span class="report-date">
                        ${report.isUserSubmitted ? '<i class="fas fa-user-edit" title="Brukerinnsendt"></i> ' : ''}
                        ${formattedDate}
                    </span>
                </div>
                <div class="report-body">
                    <p class="report-description">${report.description}</p>
                    ${report.hasPhoto ? '<div class="report-has-photo"><i class="fas fa-camera"></i> Bilde tilgjengelig</div>' : ''}
                </div>
                <div class="report-footer">
                    <div class="report-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${report.location.address}</span>
                    </div>
                    <button class="btn-show-on-map" data-report-id="${report.id}">
                        <i class="fas fa-map"></i> Vis på kart
                    </button>
                </div>
            `;
            
            reportsListContainer.appendChild(reportCard);
        });
        
        // Add event listeners to "show on map" buttons
        document.querySelectorAll('.btn-show-on-map').forEach(button => {
            button.addEventListener('click', function() {
                const reportId = this.getAttribute('data-report-id');
                showReportOnMap(reportId);
            });
        });
        
        // Click on report card selects it on the map
        document.querySelectorAll('.report-card').forEach(card => {
            card.addEventListener('click', function(e) {
                // Don't fire if clicking on the show on map button
                if (e.target.closest('.btn-show-on-map')) return;
                
                const reportId = this.dataset.reportId;
                showReportOnMap(reportId);
            });
        });


    }
    
    // Show report on the map
    function showReportOnMap(reportId) {
        const report = allReports.find(r => r.id === reportId);
        
        if (report) {
            reportsMap.setView([report.location.lat, report.location.lng], 15);
            
            // Find the marker and open its popup
            reportMarkers.forEach(marker => {
                if (marker.reportId === reportId) {
                    marker.openPopup();
                }
            });
            
            // Highlight the report card
            document.querySelectorAll('.report-card').forEach(card => {
                card.classList.remove('highlighted');
                if (card.dataset.reportId === reportId) {
                    card.classList.add('highlighted');
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }
    }
    
    // Add a report to the map
    function addReportToMap(report) {
        const markerIcon = L.divIcon({
            html: `<div class="report-marker severity-${report.severity}"><i class="${getReportTypeIcon(report.type)}"></i></div>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
        
        const marker = L.marker([report.location.lat, report.location.lng], {
            icon: markerIcon
        }).addTo(reportsMap);
        
        // Store the report ID with the marker for reference
        marker.reportId = report.id;
        
        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'report-popup';
        popupContent.innerHTML = `
            <div class="report-popup-header severity-${report.severity}">
                <i class="${getReportTypeIcon(report.type)}"></i>
                <span>${getReportTypeName(report.type)}</span>
            </div>
            <div class="report-popup-body">
                <p>${report.description}</p>
                <div class="report-popup-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(report.timestamp).toLocaleString('no-NO', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}</span>
                    <span class="severity-badge severity-${report.severity}">${getSeverityName(report.severity)}</span>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Store marker reference
        reportMarkers.push(marker);
        
        return marker;
    }
    
    // Filter reports based on user selections
    function filterReports() {
        const typeFilter = filterType.value;
        const severityFilter = filterSeverity.value;
        
        const filteredReports = allReports.filter(report => {
            return (typeFilter === 'all' || report.type === typeFilter) &&
                   (severityFilter === 'all' || report.severity === severityFilter);
        });
        
        // Clear map markers
        reportMarkers.forEach(marker => reportsMap.removeLayer(marker));
        reportMarkers = [];
        
        // Display filtered reports
        displayReports(filteredReports);
        
        // Add filtered markers to the map
        filteredReports.forEach(report => addReportToMap(report));
    }
    
    // Filter reports by proximity (show nearby reports)
    function showNearbyReports() {
        if (!userPosition) {
            // If we don't have the user's position, get it
            if ('geolocation' in navigator) {
                filterNearby.disabled = true;
                filterNearby.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Henter posisjon...';
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        userPosition = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        
                        filterNearby.disabled = false;
                        filterNearby.innerHTML = '<i class="fas fa-location-crosshairs"></i> Vis nærmeste';
                        
                        // Now filter by proximity
                        filterByProximity();
                    },
                    function(error) {
                        console.error("Geolocation error:", error);
                        
                        filterNearby.disabled = false;
                        filterNearby.innerHTML = '<i class="fas fa-location-crosshairs"></i> Vis nærmeste';
                        
                        showNotification("Kunne ikke hente posisjonen din. Vennligst prøv igjen.", "error");
                    }, 
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                showNotification("Din nettleser støtter ikke geolokalisering.", "error");
            }
        } else {
            // We already have the user's position, so filter
            filterByProximity();
        }
    }
    
    // Filter reports by proximity to user location
    function filterByProximity() {
        const maxDistance = 10; // kilometers
        
        const nearbyReports = allReports.filter(report => {
            const distance = calculateDistance(
                userPosition.lat, userPosition.lng,
                report.location.lat, report.location.lng
            );
            
            return distance <= maxDistance;
        });
        
        // Sort by distance
        nearbyReports.sort((a, b) => {
            const distanceA = calculateDistance(
                userPosition.lat, userPosition.lng,
                a.location.lat, a.location.lng
            );
            const distanceB = calculateDistance(
                userPosition.lat, userPosition.lng,
                b.location.lat, b.location.lng
            );
            
            return distanceA - distanceB;
        });
        
        // Clear map markers
        reportMarkers.forEach(marker => reportsMap.removeLayer(marker));
        reportMarkers = [];
        
        // Display nearby reports
        displayReports(nearbyReports);
        
        // Add nearby markers to the map
        nearbyReports.forEach(report => addReportToMap(report));
        
        // Center map on user location with appropriate zoom
        if (nearbyReports.length > 0) {
            const bounds = L.latLngBounds([
                [userPosition.lat, userPosition.lng],
                ...nearbyReports.map(report => [report.location.lat, report.location.lng])
            ]);
            reportsMap.fitBounds(bounds);
            
            // Add user marker if not already there
            addUserMarkerToMap();
        } else {
            reportsMap.setView([userPosition.lat, userPosition.lng], 13);
            addUserMarkerToMap();
            
            showNotification("Ingen rapporter funnet i nærheten.", "info");
        }
    }
    
    // Add user marker to map
    function addUserMarkerToMap() {
        // Remove existing user marker if any
        if (window.userLocationMarker) {
            reportsMap.removeLayer(window.userLocationMarker);
        }
        
        // Add new user marker
        window.userLocationMarker = L.marker([userPosition.lat, userPosition.lng], {
            icon: L.divIcon({
                html: '<div class="user-marker"><i class="fas fa-user"></i></div>',
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        }).addTo(reportsMap);
        
        window.userLocationMarker.bindPopup('Din posisjon');
    }
    
    // Calculate distance between two points using the Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }
    
    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    // Show a notification message
    function showNotification(message, type = "info") {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas ${getIconForType(type)}"></i> ${message}`;
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        function getIconForType(type) {
            switch(type) {
                case 'success': return 'fa-check-circle';
                case 'warning': return 'fa-exclamation-triangle';
                case 'error': return 'fa-times-circle';
                default: return 'fa-info-circle';
            }
        }
    }
    
    // Helper functions to get type name and icon
    function getReportTypeName(type) {
        const typeNames = {
            'blocked-road': 'Blokkert vei',
            'flooding': 'Flom',
            'facility-issue': 'Problem med fasilitet',
            'power-outage': 'Strømbrudd',
            'hazard': 'Annen fare'
        };
        
        return typeNames[type] || 'Ukjent type';
    }
    
    function getReportTypeIcon(type) {
        const typeIcons = {
            'blocked-road': 'fas fa-road',
            'flooding': 'fas fa-water',
            'facility-issue': 'fas fa-building',
            'power-outage': 'fas fa-bolt',
            'hazard': 'fas fa-exclamation-triangle'
        };
        
        return typeIcons[type] || 'fas fa-exclamation-circle';
    }
    
    function getSeverityName(severity) {
        const severityNames = {
            'low': 'Lav',
            'medium': 'Medium',
            'high': 'Høy'
        };
        
        return severityNames[severity] || 'Ukjent';
    }
});