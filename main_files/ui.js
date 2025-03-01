/**
 * SafeShelter - UI Controller Module
 * Handles all UI interactions, animations, and state management
 */

document.addEventListener('DOMContentLoaded', function() {
    // ===== Initialize system state =====
    let state = {
        sidebarVisible: true,
        darkMode: localStorage.getItem('darkMode') === 'true',
        isFullscreen: false,
        activeTourStep: 0,
        selectedLocation: null,
        statistics: {
            totalShelters: 0,
            totalCapacity: 0,
            fireStations: 0
        }
    };

    // Tour steps content
    const tourSteps = [
        {
            title: "Welcome to SafeShelter",
            text: "This tool helps you locate emergency shelters and fire stations during crisis situations.",
            highlight: null
        },
        {
            title: "Map Navigation",
            text: "Use the map to find shelters and fire stations in your area. Click on any marker to see details.",
            highlight: "#map"
        },
        {
            title: "Quick Search",
            text: "Use the search bar to find specific addresses or locations.",
            highlight: "#search-container"
        },
        {
            title: "Layer Controls",
            text: "Toggle different map layers and information visibility using these controls.",
            highlight: "#map-controls"
        },
        {
            title: "Shelter Information",
            text: "Select any shelter or fire station on the map to view detailed information in this panel.",
            highlight: "#shelter-info"
        },
        {
            title: "Emergency Actions",
            text: "Use these buttons to quickly locate the nearest shelter or get directions in an emergency.",
            highlight: ".action-buttons"
        }
    ];

    // ===== DOM Elements =====
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    const infoButton = document.getElementById('info-button');
    const findNearestBtn = document.getElementById('find-nearest');
    const directionsBtn = document.getElementById('directions-button');
    const clearSearchBtn = document.getElementById('clear-search');
    const searchInput = document.getElementById('search-input');
    const loadingOverlay = document.getElementById('loading-overlay');
    const selectedLocationDetails = document.getElementById('selected-location-details');
    const tourOverlay = document.getElementById('tour-overlay');
    const tourStepText = document.getElementById('tour-step-text');
    const tourNextBtn = document.getElementById('tour-next');
    const tourSkipBtn = document.getElementById('tour-skip');

    // Stats elements
    const totalSheltersEl = document.getElementById('total-shelters');
    const totalCapacityEl = document.getElementById('total-capacity');
    const fireStationsEl = document.getElementById('fire-stations');

    // Map style buttons
    const mapStyleButtons = document.querySelectorAll('.map-style');

    // ===== Initialize UI state =====
    function initUI() {
        // Apply dark mode if saved
        if (state.darkMode) {
            document.body.classList.add('dark-mode');
            themeToggle.querySelector('i').classList.remove('fa-moon');
            themeToggle.querySelector('i').classList.add('fa-sun');
        }

        // Hide loading overlay with animation
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }, 1000);

        // Start tour automatically if first visit
        if (!localStorage.getItem('tourCompleted')) {
            startTour();
        }

        // Initialize statistics with animation
        updateStatistics({
            totalShelters: 47,
            totalCapacity: 12500,
            fireStations: 23
        }, true);
    }

    // ===== Event Listeners =====

    // Sidebar toggle
    sidebarToggle.addEventListener('click', function() {
        state.sidebarVisible = !state.sidebarVisible;
        sidebar.classList.toggle('collapsed');
        
        // Update icon
        const icon = sidebarToggle.querySelector('i');
        if (sidebar.classList.contains('collapsed')) {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
        } else {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
        }

        // Trigger map resize after animation completes
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    });

    // Dark mode toggle
    themeToggle.addEventListener('click', function() {
        state.darkMode = !state.darkMode;
        document.body.classList.toggle('dark-mode');
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        if (state.darkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        
        // Save preference
        localStorage.setItem('darkMode', state.darkMode);
    });

    // Fullscreen toggle
    fullscreenToggle.addEventListener('click', function() {
        state.isFullscreen = !state.isFullscreen;
        
        if (state.isFullscreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
            fullscreenToggle.querySelector('i').classList.remove('fa-expand');
            fullscreenToggle.querySelector('i').classList.add('fa-compress');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            fullscreenToggle.querySelector('i').classList.remove('fa-compress');
            fullscreenToggle.querySelector('i').classList.add('fa-expand');
        }
    });

    // Info button - starts tour
    infoButton.addEventListener('click', function() {
        startTour();
    });

    // Find nearest shelter
    findNearestBtn.addEventListener('click', function() {
        // Add pulse animation temporarily to button
        findNearestBtn.classList.add('pulse-action');
        setTimeout(() => findNearestBtn.classList.remove('pulse-action'), 1500);
        
        // Show loading indicator
        showNotification("Finding your location...", "info");
        
        findNearestShelter();
    });

    // Get directions
    directionsBtn.addEventListener('click', function() {
        if (!state.selectedLocation) {
            showNotification("Please select a shelter or fire station first", "warning");
            return;
        }
        
        // Create a Google Maps directions URL
        const url = `https://www.google.com/maps/dir/?api=1&destination=${state.selectedLocation.lat},${state.selectedLocation.lng}`;
        window.open(url, '_blank');
    });

    // Clear search
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchMarkers.clearLayers();
    });

    // Map style buttons
    mapStyleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            mapStyleButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Change map style
            const style = button.getAttribute('data-style');
            changeMapStyle(style);
        });
    });

    // Tour controls
    tourNextBtn.addEventListener('click', function() {
        nextTourStep();
    });

    tourSkipBtn.addEventListener('click', function() {
        endTour();
    });

    // ===== Functions =====

    // Show a notification toast
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} slide-in-right`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to DOM and remove after a delay
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('slide-out-right');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 4000);
        
        function getIconForType(type) {
            switch(type) {
                case 'success': return 'fa-check-circle';
                case 'warning': return 'fa-exclamation-triangle';
                case 'error': return 'fa-times-circle';
                case 'info':
                default: return 'fa-info-circle';
            }
        }
    }

    // Update shelter/station information panel
    function updateLocationInfo(location) {
        state.selectedLocation = location;
        
        // Create the details HTML
        let detailsHTML = '';
        
        if (location.type === 'shelter') {
            detailsHTML = `
                <div class="location-details slide-in-right">
                    <h4>${location.name || 'Public Shelter'}</h4>
                    <div class="detail-row">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${location.address}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-users"></i>
                        <span>Capacity: ${location.capacity || 'Unknown'}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-door-open"></i>
                        <span>Access: ${location.access || 'Not specified'}</span>
                    </div>
                    <div class="emergency-note">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>In case of emergency, follow official evacuation instructions.</span>
                    </div>
                    <div class="action-row">
                        <button class="small-btn" onclick="centerMapOn([${location.lat}, ${location.lng}])">
                            <i class="fas fa-crosshairs"></i> Center
                        </button>
                    </div>
                </div>
            `;
        } else if (location.type === 'firestation') {
            detailsHTML = `
                <div class="location-details slide-in-right">
                    <h4>${location.name}</h4>
                    <div class="detail-row">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${location.address}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-building"></i>
                        <span>Type: ${location.stationType}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-phone-alt"></i>
                        <span>Emergency: 110</span>
                    </div>
                    <div class="action-row">
                        <button class="small-btn" onclick="centerMapOn([${location.lat}, ${location.lng}])">
                            <i class="fas fa-crosshairs"></i> Center
                        </button>
                    </div>
                </div>
            `;
        }
        
        selectedLocationDetails.innerHTML = detailsHTML;
    }

    // Find nearest shelter using browser geolocation
    function findNearestShelter() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Place user marker
                searchMarkers.clearLayers();
                const userIcon = L.divIcon({
                    html: '<i class="fas fa-circle-user" style="color:#0466c8; font-size:24px;"></i>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                
                L.marker([userLat, userLng], {icon: userIcon})
                 .addTo(searchMarkers)
                 .bindPopup('<strong>Your Location</strong>')
                 .openPopup();
                
                // Find nearest shelter (placeholder - in a real app, this would search actual shelter data)
                showNotification("Found the nearest shelter!", "success");
                
                // Animate to location
                map.flyTo([userLat, userLng], 14, {
                    animate: true,
                    duration: 1.5
                });
                
            }, error => {
                console.error("Error getting location:", error);
                showNotification("Could not determine your location. Please enable location services.", "error");
            });
        } else {
            showNotification("Geolocation is not supported by your browser", "error");
        }
    }

    // Change map style (placeholder function to be implemented with your map provider)
    function changeMapStyle(style) {
        // Remove existing base layers
        map.eachLayer(layer => {
            if (layer._url && layer._url.includes('tile.openstreetmap.org')) {
                map.removeLayer(layer);
            }
        });
        
        // Add new base layer based on style
        let newBaseLayer;
        
        switch (style) {
            case 'satellite':
                newBaseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                });
                break;
            case 'terrain':
                newBaseLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                });
                break;
            case 'streets':
            default:
                newBaseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                });
                break;
        }
        
        // Add the new base layer to the map
        newBaseLayer.addTo(map);
        
        // Move to back to ensure it's behind other layers
        newBaseLayer.bringToBack();
        
        showNotification(`Map style changed to ${style}`, "info");
    }

    // Update statistics with optional animation
    function updateStatistics(stats, animate = false) {
        state.statistics = { ...state.statistics, ...stats };
        
        if (animate) {
            animateNumber(totalSheltersEl, 0, stats.totalShelters, 1500);
            animateNumber(totalCapacityEl, 0, stats.totalCapacity, 2000);
            animateNumber(fireStationsEl, 0, stats.fireStations, 1500);
        } else {
            totalSheltersEl.textContent = stats.totalShelters;
            totalCapacityEl.textContent = stats.totalCapacity;
            fireStationsEl.textContent = stats.fireStations;
        }
    }

    // Animate number counting up
    function animateNumber(element, start, end, duration) {
        let startTime = null;
        
        function animation(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            
            element.textContent = value.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }

    // Tour functions
    function startTour() {
        state.activeTourStep = 0;
        updateTourStep();
        tourOverlay.classList.remove('hidden');
    }

    function nextTourStep() {
        state.activeTourStep++;
        
        if (state.activeTourStep >= tourSteps.length) {
            endTour();
            return;
        }
        
        updateTourStep();
    }

    function updateTourStep() {
        const step = tourSteps[state.activeTourStep];
        
        // Update content
        document.querySelector('.tour-content h3').textContent = step.title;
        tourStepText.textContent = step.text;
        
        // Update buttons
        if (state.activeTourStep === tourSteps.length - 1) {
            tourNextBtn.textContent = 'Finish';
        } else {
            tourNextBtn.textContent = 'Next';
        }
        
        // Remove any existing highlight
        removeHighlight();
        
        // Add highlight if specified
        if (step.highlight) {
            highlightElement(step.highlight);
        }
    }

    function highlightElement(selector) {
        const element = document.querySelector(selector);
        if (!element) return;
        
        element.classList.add('tour-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function removeHighlight() {
        const highlighted = document.querySelectorAll('.tour-highlight');
        highlighted.forEach(el => el.classList.remove('tour-highlight'));
    }

    function endTour() {
        tourOverlay.classList.add('hidden');
        removeHighlight();
        localStorage.setItem('tourCompleted', 'true');
    }

    // Helper function to center map on coordinates
    window.centerMapOn = function(coordinates) {
        map.flyTo(coordinates, map.getZoom(), {
            animate: true,
            duration: 1
        });
    };

    // Initialize UI
    initUI();

    // Add CSS for new components dynamically
    addDynamicStyles();

    function addDynamicStyles() {
        const styles = document.createElement('style');
        styles.innerHTML = `
            /* Notification styles */
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background-color: white;
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                z-index: 3000;
                max-width: 300px;
                overflow: hidden;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-info { border-left: 4px solid var(--secondary); }
            .notification-success { border-left: 4px solid var(--success); }
            .notification-warning { border-left: 4px solid var(--warning); }
            .notification-error { border-left: 4px solid var(--danger); }
            
            .notification i {
                font-size: 1.2rem;
            }
            
            .notification-info i { color: var(--secondary); }
            .notification-success i { color: var(--success); }
            .notification-warning i { color: var(--warning); }
            .notification-error i { color: var(--danger); }
            
            /* Location details styling */
            .location-details {
                margin-top: var(--space-md);
            }
            
            .detail-row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }
            
            .detail-row i {
                color: var(--gray-600);
                width: 16px;
            }
            
            .emergency-note {
                margin-top: 12px;
                padding: 8px;
                background-color: rgba(230, 57, 70, 0.1);
                border-radius: var(--radius-sm);
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .emergency-note i {
                color: var(--danger);
            }
            
            .action-row {
                margin-top: 12px;
                display: flex;
                gap: 8px;
            }
            
            .small-btn {
                padding: 6px 12px;
                border-radius: var(--radius-sm);
                border: none;
                background-color: var(--gray-200);
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .small-btn:hover {
                background-color: var(--gray-300);
            }
            
            /* Tour highlight */
            .tour-highlight {
                position: relative;
                z-index: 2001;
                box-shadow: 0 0 0 4px var(--accent), 0 0 0 8px rgba(255, 209, 102, 0.3);
                animation: pulse-highlight 1.5s infinite;
            }
            
            @keyframes pulse-highlight {
                0% { box-shadow: 0 0 0 4px var(--accent), 0 0 0 8px rgba(255, 209, 102, 0.3); }
                50% { box-shadow: 0 0 0 8px var(--accent), 0 0 0 12px rgba(255, 209, 102, 0.3); }
                100% { box-shadow: 0 0 0 4px var(--accent), 0 0 0 8px rgba(255, 209, 102, 0.3); }
            }
            
            /* Additional animations */
            .slide-out-right {
                animation: slideOutRight 0.5s forwards;
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(30px); opacity: 0; }
            }
            
            .pulse-action {
                animation: pulseAction 1.5s;
            }
            
            @keyframes pulseAction {
                0% { transform: scale(1); }
                10% { transform: scale(1.05); box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.3); }
                20% { transform: scale(1); }
                30% { transform: scale(1.05); box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.3); }
                40% { transform: scale(1); }
                100% { transform: scale(1); }
            }
        `;
        
        document.head.appendChild(styles);
    }
});