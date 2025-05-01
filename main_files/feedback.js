/**
 * SafeShelter - Crowdsourced Safety Reports Module
 * Handles collection, display, and interaction with user-submitted safety reports
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize maps
    let locationMap, reportsMap;
    let selectedLocationMarker = null;
    let userPosition = null;
    let allReports = [];
    let reportMarkers = [];
    let currentSlide = 0;
    const reportsPerView = 3; // Number of reports visible at once in slider
    
    // DOM elements
    const reportForm = document.getElementById('safety-report-form');
    const reportsSlider = document.getElementById('reports-slider');
    const descriptionField = document.getElementById('report-description');
    const charCount = document.getElementById('char-count');
    const imagePreview = document.getElementById('image-preview');
    const photoUpload = document.getElementById('report-photo');
    const photoFilename = document.getElementById('photo-filename');
    const contactToggle = document.getElementById('contact-toggle');
    const contactFields = document.getElementById('contact-fields');
    const confirmationModal = document.getElementById('confirmation-modal');
    const filterType = document.getElementById('filter-type');
    const filterSeverity = document.getElementById('filter-severity');
    const filterNearby = document.getElementById('filter-nearby');
    const useMyLocationBtn = document.getElementById('use-my-location');
    const slideNextBtn = document.getElementById('slide-next');
    const slidePrevBtn = document.getElementById('slide-prev');
    const toggleShowcaseBtn = document.getElementById('toggle-showcase');
    const showcaseContent = document.querySelector('.showcase-content');
    
    // Initialize the application
    initializeApp();
    
    // Main initialization function
    function initializeApp() {
        initializeLocationMap();
        initializeReportsMap();
        setupEventListeners();
        loadExistingReports();
        setupShowcaseToggle();
    }
    
    // Initialize the location selection map
    function initializeLocationMap() {
        locationMap = L.map('location-map').setView([58.1599, 8.0182], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(locationMap);
        
        // Add click event to set location
        locationMap.on('click', function(e) {
            setSelectedLocation(e.latlng.lat, e.latlng.lng);
        });
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
        // Character count for description
        descriptionField.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
        
        // Contact information toggle
        contactToggle.addEventListener('change', function() {
            contactFields.classList.toggle('hidden', !this.checked);
        });
        
        // Photo upload preview
        photoUpload.addEventListener('change', function() {
            handlePhotoUpload(this);
        });
        
        // Form submission
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitReport();
        });
        
        // Modal close buttons
        document.getElementById('new-report-btn').addEventListener('click', function() {
            confirmationModal.classList.add('hidden');
            reportForm.reset();
            imagePreview.classList.add('hidden');
            imagePreview.innerHTML = '';
            photoFilename.textContent = 'Velg bilde';
            contactFields.classList.add('hidden');
            contactToggle.checked = false;
            charCount.textContent = '0';
        });
        
        document.getElementById('view-report-btn').addEventListener('click', function() {
            confirmationModal.classList.add('hidden');
            document.querySelector('.reports-showcase').scrollIntoView({ behavior: 'smooth' });
            
            // Open the showcase if it's closed
            if (showcaseContent.classList.contains('collapsed')) {
                toggleShowcase();
            }
        });
        
        // Filters
        filterType.addEventListener('change', filterReports);
        filterSeverity.addEventListener('change', filterReports);
        filterNearby.addEventListener('click', showNearbyReports);
        
        // Use my location button
        useMyLocationBtn.addEventListener('click', useCurrentLocation);
        
        // Reset button behavior
        reportForm.addEventListener('reset', function() {
            setTimeout(() => {
                charCount.textContent = '0';
                imagePreview.classList.add('hidden');
                imagePreview.innerHTML = '';
                photoFilename.textContent = 'Velg bilde';
                contactFields.classList.add('hidden');
                contactToggle.checked = false;
                
                // Reset location marker
                if (selectedLocationMarker) {
                    selectedLocationMarker.remove();
                    selectedLocationMarker = null;
                    document.getElementById('selected-location').textContent = "Ingen lokasjon valgt";
                    document.getElementById('report-lat').value = '';
                    document.getElementById('report-lng').value = '';
                }
            }, 10);
        });
        
        // Slider navigation
        slideNextBtn.addEventListener('click', () => {
            navigateSlider(1);
        });
        
        slidePrevBtn.addEventListener('click', () => {
            navigateSlider(-1);
        });
    }
    
    // Setup showcase toggle functionality
    function setupShowcaseToggle() {
        // Start with the showcase expanded
        showcaseContent.classList.remove('collapsed');
        
        toggleShowcaseBtn.addEventListener('click', toggleShowcase);
    }
    
    // Toggle the showcase visibility
    function toggleShowcase() {
        showcaseContent.classList.toggle('collapsed');
        
        // Change the icon direction
        const icon = toggleShowcaseBtn.querySelector('i');
        if (showcaseContent.classList.contains('collapsed')) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        } else {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            
            // Refresh the map when expanding
            setTimeout(() => {
                if (reportsMap) {
                    reportsMap.invalidateSize();
                }
            }, 300);
        }
    }
    
    // Handle photo upload and preview
    function handlePhotoUpload(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            
            photoFilename.textContent = file.name;
            
            reader.onload = function(e) {
                imagePreview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-image">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                imagePreview.classList.remove('hidden');
                
                document.querySelector('.remove-image').addEventListener('click', function() {
                    imagePreview.classList.add('hidden');
                    imagePreview.innerHTML = '';
                    photoUpload.value = '';
                    photoFilename.textContent = 'Velg bilde';
                });
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    // Use the user's current location
    function useCurrentLocation() {
        if ('geolocation' in navigator) {
            useMyLocationBtn.disabled = true;
            useMyLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Henter posisjon...';
            
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    userPosition = { lat, lng };
                    setSelectedLocation(lat, lng);
                    
                    // Re-enable the button
                    useMyLocationBtn.disabled = false;
                    useMyLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Bruk min posisjon';
                },
                function(error) {
                    console.error("Geolocation error:", error);
                    
                    // Show error notification
                    const notification = document.createElement('div');
                    notification.className = 'notification error';
                    notification.innerHTML = `
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Kunne ikke hente posisjonen din. Vennligst prøv igjen eller klikk på kartet.</span>
                    `;
                    document.body.appendChild(notification);
                    
                    // Remove notification after 5 seconds
                    setTimeout(() => {
                        notification.remove();
                    }, 5000);
                    
                    // Re-enable the button
                    useMyLocationBtn.disabled = false;
                    useMyLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Bruk min posisjon';
                }, 
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            alert("Din nettleser støtter ikke geolokalisering. Vennligst klikk på kartet.");
        }
    }
    
    // Set location based on lat/lng
    function setSelectedLocation(lat, lng) {
        document.getElementById('report-lat').value = lat;
        document.getElementById('report-lng').value = lng;
        
        // Update the displayed location text
        fetchLocationName(lat, lng)
            .then(locationName => {
                document.getElementById('selected-location').textContent = locationName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                document.getElementById('location-address').value = locationName || '';
            });
        
        // Remove existing marker if any
        if (selectedLocationMarker) {
            selectedLocationMarker.remove();
        }
        
        // Add new marker
        selectedLocationMarker = L.marker([lat, lng]).addTo(locationMap);
        
        // Center map on the location
        locationMap.setView([lat, lng], 14);
    }
    
    // Fetch location name from coordinates using reverse geocoding
    async function fetchLocationName(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            return data.display_name;
        } catch (error) {
            console.error('Error fetching location name:', error);
            return null;
        }
    }
    
    // Submit a new report
    function submitReport() {
        if (!validateForm()) return;
        
        // Get form values
        const reportType = document.getElementById('report-type').value;
        const severity = document.querySelector('input[name="severity"]:checked').value;
        const description = document.getElementById('report-description').value;
        const lat = document.getElementById('report-lat').value;
        const lng = document.getElementById('report-lng').value;
        
        // Get optional values
        const contactName = document.getElementById('contact-toggle').checked ? 
                           document.getElementById('contact-name').value : null;
        const contactPhone = document.getElementById('contact-toggle').checked ? 
                            document.getElementById('contact-phone').value : null;
        
        // Create report object
        const report = {
            id: 'SR-' + Math.floor(Math.random() * 100000),
            type: reportType,
            severity: severity,
            description: description,
            location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                address: document.getElementById('selected-location').textContent
            },
            timestamp: new Date().toISOString(),
            status: 'active',
            contact: contactName ? { name: contactName, phone: contactPhone } : null,
            // In a real implementation, the photo would be uploaded to a server
            hasPhoto: document.getElementById('report-photo').files.length > 0
        };
        
        // In a real implementation, this would be sent to a server
        console.log('Submitting report:', report);
        
        // For demo, we'll just add it to our local collection
        allReports.unshift(report);
        
        // Update the reports display
        displayReports(allReports);
        addReportToMap(report);
        
        // Show confirmation modal
        document.getElementById('report-id').textContent = report.id;
        confirmationModal.classList.remove('hidden');
    }
    
    // Validate form before submission
    function validateForm() {
        let isValid = true;
        
        // Check required fields
        const requiredFields = [
            { id: 'report-type', message: 'Vennligst velg type rapport.' },
            { id: 'report-description', message: 'Vennligst gi en beskrivelse.' }
        ];
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element.value) {
                showValidationError(element, field.message);
                isValid = false;
            } else {
                clearValidationError(element);
            }
        });
        
        // Check if location is selected
        if (!document.getElementById('report-lat').value || 
            !document.getElementById('report-lng').value) {
            showValidationError(document.querySelector('.location-group'), 
                              'Vennligst velg en lokasjon på kartet.');
            isValid = false;
        } else {
            clearValidationError(document.querySelector('.location-group'));
        }
        
        return isValid;
    }
    
    // Display validation error
    function showValidationError(element, message) {
        // Remove any existing error
        clearValidationError(element);
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        // Insert after the element or at the end of its container
        if (element.nextSibling) {
            element.parentNode.insertBefore(errorDiv, element.nextSibling);
        } else {
            element.parentNode.appendChild(errorDiv);
        }
        
        // Highlight the element
        element.classList.add('error');
    }
    
    // Clear validation error
    function clearValidationError(element) {
        element.classList.remove('error');
        const parent = element.parentNode;
        const errors = parent.querySelectorAll('.validation-error');
        errors.forEach(error => error.remove());
    }
    
    // Load existing reports (mock data for demo)
    function loadExistingReports() {
        // Show loading state
        reportsSlider.innerHTML = `
            <div class="loading-reports">
                <div class="spinner"></div>
                <p>Laster inn rapporter...</p>
            </div>
        `;
        
        // Simulate API call delay
        setTimeout(() => {
            // Generate some mock reports
            allReports = generateMockReports();
            
            // Display the reports
            displayReports(allReports);
            
            // Add reports to map
            allReports.forEach(report => addReportToMap(report));
        }, 1500);
    }
    
    // Generate mock safety reports
    function generateMockReports() {
        const types = ['blocked-road', 'flooding', 'facility-issue', 'power-outage', 'hazard'];
        const severities = ['low', 'medium', 'high'];
        const baseLocation = { lat: 58.1599, lng: 8.0182 }; // Kristiansand
        
        const mockReports = [];
        
        // Generate more reports for better carousel effect
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
    
    // Display the reports in the horizontal slider
    function displayReports(reports) {
        const activeReports = reports.filter(report => report.status === 'active');
        
        if (activeReports.length === 0) {
            reportsSlider.innerHTML = `
                <div class="no-reports">
                    <i class="fas fa-info-circle"></i>
                    <p>Ingen rapporter funnet med valgte filtre.</p>
                </div>
            `;
            return;
        }
        
        // Create slide track container
        reportsSlider.innerHTML = `<div class="slide-track"></div>`;
        const slideTrack = reportsSlider.querySelector('.slide-track');
        
        // Add report cards to the track
        activeReports.forEach(report => {
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
            reportCard.dataset.reportId = report.id;
            reportCard.innerHTML = `
                <div class="report-header">
                    <div class="report-type">
                        <i class="${typeIcon}"></i>
                        <span>${getReportTypeName(report.type)}</span>
                    </div>
                    <span class="report-date">${formattedDate}</span>
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
            
            slideTrack.appendChild(reportCard);
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
        
        // Reset slide position and update navigation state
        currentSlide = 0;
        navigateSlider(0);
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
                    
                    // Find which slide it's on
                    const allCards = Array.from(document.querySelectorAll('.report-card'));
                    const cardIndex = allCards.indexOf(card);
                    const slideIndex = Math.floor(cardIndex / reportsPerView);
                    
                    // Only navigate if not already on correct slide
                    if (Math.floor(currentSlide / reportsPerView) !== slideIndex) {
                        currentSlide = slideIndex * reportsPerView;
                        navigateSlider(0);
                    }
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
    
    // Navigate the slider
    function navigateSlider(direction) {
        const slideTrack = document.querySelector('.slide-track');
        const cards = slideTrack.querySelectorAll('.report-card');
        
        // Calculate boundaries
        const maxSlide = Math.max(0, cards.length - reportsPerView);
        
        // Update currentSlide
        currentSlide = currentSlide + direction;
        
        // Ensure within bounds
        currentSlide = Math.max(0, Math.min(currentSlide, maxSlide));
        
        // Update button states
        slidePrevBtn.disabled = currentSlide === 0;
        slideNextBtn.disabled = currentSlide >= maxSlide;
        
        // Apply the transform to move the slider
        slideTrack.style.transform = `translateX(-${currentSlide * (100 / reportsPerView)}%)`;
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
                        
                        alert("Kunne ikke hente posisjonen din. Vennligst prøv igjen eller velg en posisjon på kartet.");
                    }, 
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                alert("Din nettleser støtter ikke geolokalisering.");
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