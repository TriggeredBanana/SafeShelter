/**
 * SafeShelter - UI-kontrollmodul
 * Håndterer alle UI-interaksjoner, animasjoner og tilstandshåndtering
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser systemtilstand
    let state = {
        sidebarVisible: true,
        isFullscreen: false,
        activeTourStep: 0,
        selectedLocation: null,
        statistics: {
            totalShelters: 0,
            totalCapacity: 0,
            fireStations: 0
        }
    };

    // Omvisningstrinninnhold
    const tourSteps = [
        {
            title: "Velkommen til SafeShelter",
            text: "Dette verktøyet hjelper deg med å lokalisere tilfluktsrom og brannstasjoner under krisesituasjoner.",
            highlight: null
        },
        {
            title: "Kartnavigasjon",
            text: "Bruk kartet for å finne tilfluktsrom og brannstasjoner i ditt område. Klikk på en markør for å se detaljer.",
            highlight: "#map"
        },
        {
            title: "Hurtigsøk",
            text: "Bruk søkefeltet til å finne spesifikke adresser eller steder.",
            highlight: "#search-container"
        },
        {
            title: "Lagkontroller",
            text: "Slå av og på ulike kartlag og informasjonsvisning med disse kontrollene.",
            highlight: "#map-controls"
        },
        {
            title: "Tilfluktsrominformasjon",
            text: "Velg et tilfluktsrom eller en brannstasjon på kartet for å se detaljert informasjon i dette panelet.",
            highlight: "#shelter-info"
        },
        {
            title: "Nødhandlinger",
            text: "Bruk disse knappene til raskt å finne nærmeste tilfluktsrom eller få veibeskrivelser i nødsituasjoner.",
            highlight: ".action-buttons"
        }
    ];

    // DOM-elementer
    const sidebar = document.getElementById('sidebar');
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

    // Statistikkelementer
    const totalSheltersEl = document.getElementById('total-shelters');
    const totalCapacityEl = document.getElementById('total-capacity');
    const fireStationsEl = document.getElementById('fire-stations');

    // Kartstilknapper
    const mapStyleButtons = document.querySelectorAll('.map-style');

    // Initialiser UI-tilstand
    function initUI() {
        // Skjul lastings-overlegg med animasjon
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }, 1000);

        // Start omvisning automatisk hvis første besøk
        if (!localStorage.getItem('tourCompleted')) {
            startTour();
        }

        // Initialiser statistikk med animasjon
        updateStatistics({
            totalShelters: 47,
            totalCapacity: 12500,
            fireStations: 23
        }, true);
    }

    // Hendelselyttere

    const logoText = document.querySelector('.logo h2');
    if (logoText) {
        logoText.style.cursor = 'pointer';
        logoText.addEventListener('click', function() {
            window.location.reload();
        });
    }

    // Fullskjermveksling
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

    // Info-knapp - starter omvisning
    infoButton.addEventListener('click', function() {
        startTour();
    });

    // Finn nærmeste tilfluktsrom
    findNearestBtn.addEventListener('click', function() {
        // Legg til pulseringsanimasjon midlertidig på knappen
        findNearestBtn.classList.add('pulse-action');
        setTimeout(() => findNearestBtn.classList.remove('pulse-action'), 1500);
        
        // Kall funksjonen fra mapoverlay.js
        window.findNearestShelter();
    });

    // Få veibeskrivelser
    directionsBtn.addEventListener('click', function() {
        if (!state.selectedLocation) {
            showNotification("Velg først et tilfluktsrom eller en brannstasjon", "warning");
            return;
        }
        
        // Lag en Google Maps veibeskrivelse-URL
        const url = `https://www.google.com/maps/dir/?api=1&destination=${state.selectedLocation.lat},${state.selectedLocation.lng}`;
        window.open(url, '_blank');
    });

    // Tøm søk
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchMarkers.clearLayers();
    });

    // Kartstilknapper
    mapStyleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Fjern aktiv klasse fra alle knapper
            mapStyleButtons.forEach(b => b.classList.remove('active'));
            
            // Legg til aktiv klasse på klikket knapp
            button.classList.add('active');
            
            // Endre kartstil ved å bruke funksjonen fra mapoverlay.js
            const style = button.getAttribute('data-style');
            window.changeMapStyle(style);
        });
    });

    // Vis en varsling i høyre hjørne
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} slide-in-right`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Legg til i DOM og fjern etter en forsinkelse
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

    window.showNotification = showNotification;

    // Oppdater tilfluktsrom/stasjons-informasjonspanel
    function updateLocationInfo(location) {
        state.selectedLocation = location;
        
        // Lag detaljert HTML
        let detailsHTML = '';
        
        if (location.type === 'shelter') {
            detailsHTML = `
                <div class="location-details slide-in-right">
                    <h4>${location.name || 'Offentlig tilfluktsrom'}</h4>
                    <div class="detail-row">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${location.address}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-users"></i>
                        <span>Kapasitet: ${location.capacity || 'Ukjent'}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-door-open"></i>
                        <span>Tilgang: ${location.access || 'Ikke spesifisert'}</span>
                    </div>
                    <div class="emergency-note">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>I nødsituasjoner, følg offisielle evakueringsinstruksjoner.</span>
                    </div>
                    <div class="action-row">
                        <button class="small-btn" onclick="centerMapOn([${location.lat}, ${location.lng}])">
                            <i class="fas fa-crosshairs"></i> Sentrer
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
                        <span>Nødnummer: 110</span>
                    </div>
                    <div class="action-row">
                        <button class="small-btn" onclick="centerMapOn([${location.lat}, ${location.lng}])">
                            <i class="fas fa-crosshairs"></i> Sentrer
                        </button>
                    </div>
                </div>
            `;
        }
        
        selectedLocationDetails.innerHTML = detailsHTML;
    }

    // Eksporter updateLocationInfo til global bruk
    window.updateLocationInfo = updateLocationInfo;


    // Oppdater statistikk med animasjon
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

    // Animer tall som telles opp
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

    // Omvisningsfunksjoner - forbedret versjon
    function startTour() {
        // Create the tour container if it doesn't exist
        createTourInterface();
        
        // Reset step and start
        state.activeTourStep = 0;
        updateTourStep();
        
        // Show the overlay with fade-in
        tourOverlay.style.opacity = '0';
        tourOverlay.classList.remove('hidden');
        setTimeout(() => {
            tourOverlay.style.opacity = '1';
        }, 10);
    }

    function createTourInterface() {
        // Remove existing tour DOM elements if they exist
        const existingTooltip = document.getElementById('tour-tooltip');
        if (existingTooltip) existingTooltip.remove();
        
        // Create tooltip for step-specific guidance
        const tourTooltip = document.createElement('div');
        tourTooltip.id = 'tour-tooltip';
        tourTooltip.className = 'tour-tooltip hidden';
        tourTooltip.innerHTML = `
            <div class="tour-tooltip-content">
                <div class="tour-header">
                    <h3></h3>
                    <button class="tour-close" aria-label="Lukk omvisning">×</button>
                </div>
                <div class="tour-body">
                    <p></p>
                </div>
                <div class="tour-footer">
                    <div class="tour-progress">
                        <span class="tour-current">1</span>/<span class="tour-total">${tourSteps.length}</span>
                    </div>
                    <div class="tour-buttons">
                        <button class="tour-prev" disabled>Forrige</button>
                        <button class="tour-next">Neste</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(tourTooltip);
        
        // Set up event listeners for the new elements
        document.querySelector('.tour-close').addEventListener('click', endTour);
        document.querySelector('.tour-prev').addEventListener('click', prevTourStep);
        document.querySelector('.tour-next').addEventListener('click', nextTourStep);
    }

    function nextTourStep() {
        state.activeTourStep++;
        
        if (state.activeTourStep >= tourSteps.length) {
            endTour();
            return;
        }
        
        updateTourStep();
    }

    function prevTourStep() {
        state.activeTourStep--;
        
        if (state.activeTourStep < 0) {
            state.activeTourStep = 0;
        }
        
        updateTourStep();
    }

    function updateTourStep() {
        const step = tourSteps[state.activeTourStep];
        const tooltip = document.getElementById('tour-tooltip');
        const prevBtn = document.querySelector('.tour-prev');
        const nextBtn = document.querySelector('.tour-next');
        
        // Update tooltip content
        tooltip.querySelector('h3').textContent = step.title;
        tooltip.querySelector('.tour-body p').textContent = step.text;
        tooltip.querySelector('.tour-current').textContent = state.activeTourStep + 1;
        
        // Update navigation buttons
        prevBtn.disabled = state.activeTourStep === 0;
        
        if (state.activeTourStep === tourSteps.length - 1) {
            nextBtn.textContent = 'Fullfør';
        } else {
            nextBtn.textContent = 'Neste';
        }
        
        // First hide the tooltip during transition
        tooltip.classList.add('hidden');
        
        // Remove existing highlights
        removeHighlight();
        
        // Add new highlight if specified
        if (step.highlight) {
            setTimeout(() => highlightElement(step.highlight), 100);
        } else {
            // For steps with no highlight, center the tooltip
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            tooltip.classList.remove('hidden');
        }
    }

    function highlightElement(selector) {
        const element = document.querySelector(selector);
        const tooltip = document.getElementById('tour-tooltip');
        
        if (!element) {
            console.warn(`Element not found: ${selector}`);
            tooltip.classList.remove('hidden');
            return;
        }
        
        // Add highlight class to element
        element.classList.add('tour-highlight');
        element.setAttribute('data-tour-highlighted', 'true');
        
        // Make sure the element is in view - handle sidebar content separately
        const sidebarContent = document.querySelector('.sidebar-content');
        
        // Special handling for action buttons (nødhandlinger)
        if (selector === '.action-buttons') {
            // First ensure sidebar is visible if it contains our element
            if (sidebarContent) {
                // Scroll the sidebar to show the action buttons
                sidebarContent.scrollTop = sidebarContent.scrollHeight;
                
                // Wait for scrolling to complete
                setTimeout(() => {
                    // Get updated position after scrolling
                    const rect = element.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                    
                    // Create spotlight effect with updated position
                    createSpotlight(rect);
                    
                    // Position the tooltip based on available space
                    positionTooltip(tooltip, rect, scrollTop, scrollLeft);
                    
                    // Show tooltip with slight delay for smooth transition
                    setTimeout(() => {
                        tooltip.classList.remove('hidden');
                    }, 300);
                }, 500); // Wait longer for scrolling to complete
            }
        } else if (sidebarContent && sidebarContent.contains(element)) {
            // For other elements inside sidebar, make sure they're scrolled into view
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
            });
            
            // Wait for scrolling to complete
            setTimeout(() => {
                // Get updated position after scrolling
                const updatedRect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                
                // Create spotlight effect with updated position
                createSpotlight(updatedRect);
                
                // Position the tooltip based on available space
                positionTooltip(tooltip, updatedRect, scrollTop, scrollLeft);
                
                // Show tooltip
                tooltip.classList.remove('hidden');
            }, 500);
        } else {
            // For other elements (not in sidebar), get position and highlight
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // Create spotlight effect
            createSpotlight(rect);
            
            // Position the tooltip based on available space
            positionTooltip(tooltip, rect, scrollTop, scrollLeft);
            
            // Scroll element into view
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
            });
            
            // Show tooltip with slight delay for smooth transition
            setTimeout(() => {
                tooltip.classList.remove('hidden');
            }, 300);
        }
    }
    
    function createSpotlight(rect) {
        // Clear any existing spotlights
        const existingSpotlights = document.querySelectorAll('.tour-spotlight, .tour-spotlight-border');
        existingSpotlights.forEach(el => el.remove());
        
        // Create the spotlight effect
        const spotlight = document.createElement('div');
        spotlight.className = 'tour-spotlight';
        spotlight.style.top = `${rect.top}px`;
        spotlight.style.left = `${rect.left}px`;
        spotlight.style.width = `${rect.width}px`;
        spotlight.style.height = `${rect.height}px`;
        document.body.appendChild(spotlight);
        
        // Create a pulsating border around the spotlight
        const border = document.createElement('div');
        border.className = 'tour-spotlight-border';
        border.style.top = `${rect.top - 5}px`;
        border.style.left = `${rect.left - 5}px`;
        border.style.width = `${rect.width + 10}px`;
        border.style.height = `${rect.height + 10}px`;
        document.body.appendChild(border);
    }
    
    function positionTooltip(tooltip, rect, scrollTop, scrollLeft) {
        const tooltipWidth = 400; // Match the actual CSS width
        const tooltipHeight = 200; // Estimated tooltip height
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;
        
        let tooltipX, tooltipY, position;
        
        // Get current tour step and highlighted element
        const currentStep = state.activeTourStep;
        const highlightedElement = document.querySelector('[data-tour-highlighted="true"]');
        
        // Step-specific positioning
        if (highlightedElement && highlightedElement.id === "shelter-info") {
            // Step 5 - Tilfluktsrominformasjon
            position = 'bottom';
            tooltipY = rect.bottom + 25;
            tooltipX = Math.min(elementCenterX, windowWidth - (tooltipWidth/2) - 20);
            tooltipX = Math.max(tooltipX, tooltipWidth/2 + 20);
        }
        else if (highlightedElement && highlightedElement.classList.contains('action-buttons')) {
            // Step 6 - Nødhandlinger (action buttons)
            position = 'top';
            tooltipY = rect.top - 70;
            tooltipX = Math.min(elementCenterX, windowWidth - (tooltipWidth/2) - 20);
            tooltipX = Math.max(tooltipX, tooltipWidth/2 + 20);
        }
        else if (highlightedElement && highlightedElement.id === "search-container") {
            // Step 3 - Search container
            position = 'bottom';
            tooltipY = rect.bottom + 20;
            tooltipX = Math.min(elementCenterX, windowWidth - (tooltipWidth/2) - 20);
            tooltipX = Math.max(tooltipX, tooltipWidth/2 + 20);
        }
        else if (highlightedElement && highlightedElement.id === "map-controls") {
            // Step 4 - Map controls
            position = 'left';
            tooltipY = elementCenterY;
            tooltipX = rect.left - tooltipWidth - 20;
            
            // If not enough space on left, try bottom
            if (tooltipX < 20) {
                position = 'bottom';
                tooltipX = elementCenterX;
                tooltipY = rect.bottom + 20;
                
                // Ensure tooltip is within screen horizontally
                tooltipX = Math.min(tooltipX, windowWidth - (tooltipWidth/2) - 20);
                tooltipX = Math.max(tooltipX, tooltipWidth/2 + 20);
            }
        }
        else {
            // Default positioning logic for other steps
            if (rect.top > tooltipHeight + 40 && rect.left > windowWidth/2 - tooltipWidth/2 && rect.right < windowWidth/2 + tooltipWidth/2) {
                // Enough space above and horizontally centered
                tooltipY = rect.top - 20;
                tooltipX = elementCenterX;
                position = 'top';
            } else if (windowHeight - rect.bottom > tooltipHeight + 40) {
                // Enough space below
                tooltipY = rect.bottom + 20;
                tooltipX = elementCenterX;
                position = 'bottom';
                
                // Ensure tooltip is within screen horizontally
                tooltipX = Math.min(tooltipX, windowWidth - (tooltipWidth/2) - 20);
                tooltipX = Math.max(tooltipX, tooltipWidth/2 + 20);
            } else if (rect.left > tooltipWidth + 40) {
                // Enough space to the left
                tooltipX = rect.left - tooltipWidth/2 - 20;
                tooltipY = elementCenterY;
                position = 'left';
            } else if (windowWidth - rect.right > tooltipWidth + 40) {
                // Enough space to the right
                tooltipX = rect.right + tooltipWidth/2 + 20;
                tooltipY = elementCenterY;
                position = 'right';
            } else {
                // Default to centered
                tooltipX = windowWidth / 2;
                tooltipY = windowHeight / 2;
                position = 'center';
            }
        }
        
        // Apply position and transform based on position
        tooltip.className = `tour-tooltip tooltip-${position}`;
        
        if (position === 'top') {
            tooltip.style.top = `${tooltipY - tooltipHeight}px`;
            tooltip.style.left = `${tooltipX}px`;
            tooltip.style.transform = 'translateX(-50%)';
        } else if (position === 'bottom') {
            tooltip.style.top = `${tooltipY}px`;
            tooltip.style.left = `${tooltipX}px`;
            tooltip.style.transform = 'translateX(-50%)';
        } else if (position === 'left') {
            tooltip.style.top = `${tooltipY}px`;
            tooltip.style.left = `${tooltipX}px`;
            tooltip.style.transform = 'translate(0, -50%)';
        } else if (position === 'right') {
            tooltip.style.top = `${tooltipY}px`;
            tooltip.style.left = `${tooltipX}px`;
            tooltip.style.transform = 'translate(0, -50%)';
        } else {
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
        }
    }

    function removeHighlight() {
        // Remove spotlight and border elements
        const spotlights = document.querySelectorAll('.tour-spotlight, .tour-spotlight-border');
        spotlights.forEach(el => el.remove());
        
        // Remove highlight class from any elements
        const highlighted = document.querySelectorAll('[data-tour-highlighted="true"]');
        highlighted.forEach(el => {
            el.classList.remove('tour-highlight');
            el.removeAttribute('data-tour-highlighted');
        });
    }

    function endTour() {
        // Fade out overlay
        tourOverlay.style.opacity = '0';
        
        // Hide tooltip
        const tooltip = document.getElementById('tour-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
        
        // Clean up after animation
        setTimeout(() => {
            tourOverlay.classList.add('hidden');
            removeHighlight();
            
            // Remove tooltip element
            if (tooltip) tooltip.remove();
            
            // Mark tour as completed
            localStorage.setItem('tourCompleted', 'true');
        }, 300);
    }

    // Hjelpefunksjon for å sentrere kart på koordinater
    window.centerMapOn = function(coordinates) {
        map.flyTo(coordinates, map.getZoom(), {
            animate: true,
            duration: 1
        });
    };

    // Initialiser UI
    initUI();

    // Legg til CSS for nye komponenter dynamisk
    addDynamicStyles();

    function addDynamicStyles() {
        const styles = document.createElement('style');
        styles.innerHTML = `
            /* Varslingsstiler */
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
            
            /* Plassdetalj-stiler */
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
            
            /* Omvisningsfremheving */
            #tour-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: transparent;
                z-index: 2000;
                background: rgba(0, 0, 0, 0.07);
                transition: opacity 0.3s ease;
                pointer-events: auto;
            }
        
            .tour-highlight {
                position: relative;
                z-index: 2001;
                animation: highlight-pulse 2s infinite;
            }
            
            .tour-spotlight {
                position: absolute;
                z-index: 2002;
                background: transparent;
                box-shadow: none;
                pointer-events: none;
                border-radius: 4px;
            }
            
            .tour-spotlight-border {
                position: absolute;
                z-index: 2001;
                box-shadow: 0 0 0 2px var(--accent), 0 0 12px rgba(255, 218, 132, 1);
                pointer-events: none;
                border-radius: 12px;
                animation: spotlight-pulse 1.5s infinite;
                border: 6px solid rgba(255, 218, 132, 1);
            }
            
            .tour-tooltip {
                position: absolute;
                z-index: 2005;
                width: 400px;
                background-color: white;
                border-radius: 12px;
                box-shadow: 0 6px 30px rgba(0, 0, 0, 0.15);
                transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                overflow: hidden;
            }
            
            .tour-tooltip.hidden {
                opacity: 0;
                pointer-events: none;
                transform: scale(0.9) translateY(10px);
            }
            
            .tour-tooltip::after {
                content: '';
                position: absolute;
                width: 14px;
                height: 14px;
                background: white;
                transform: rotate(45deg);
            }
            
            .tooltip-top::after {
                bottom: -7px;
                left: 50%;
                margin-left: -7px;
            }
            
            .tooltip-bottom::after {
                top: -7px;
                left: 50%;
                margin-left: -7px;
            }
            
            .tooltip-left::after {
                right: -7px;
                top: 50%;
                margin-top: -7px;
            }
            
            .tooltip-right::after {
                left: -7px;
                top: 50%;
                margin-top: -7px;
            }
            
            .tour-tooltip-content {
                position: relative;
                z-index: 1;
            }
            
            .tour-header {
                background-color: var(--primary) !important;
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .tour-header h3 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 700;
            }
            
            .tour-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                line-height: 1;
                padding: 0;
                cursor: pointer;
                color: var(--dark);
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .tour-close:hover {
                opacity: 1;
            }
            
            .tour-body {
                padding: 20px;
                color: var(--gray-800);
                font-size: 1rem;
                line-height: 1.6;
            }
            
            .tour-body p {
                margin: 0;
            }
            
            .tour-footer {
                padding: 15px 20px;
                background-color: var(--gray-100);
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid var(--gray-200);
            }
            
            .tour-progress {
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--gray-600);
            }
            
            .tour-buttons {
                display: flex;
                gap: 8px;
            }
            
            .tour-prev, .tour-next {
                padding: 8px 15px;
                border: none;
                border-radius: 20px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .tour-prev {
                background-color: var(--gray-800);
                color: var(--gray-800);
            }
            
            .tour-prev:hover:not(:disabled) {
                background-color: var(--gray-400);
            }
            
            .tour-prev:disabled {
                opacity: 0.5;
                cursor: default;
            }
            
            .tour-next {
                background-color: var(--primary) !important;
                color: white;
                font-weight: bold;
            }
            
            .tour-next:hover {
                background-color: var(--primary-dark) !important;
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }

            .tour-secondary {
                background-color: var(--secondary);
                color: white;
            }
            
            .tour-secondary:hover {
                background-color: var(--secondary-dark);
            }
            
            @keyframes spotlight-pulse {
                0% { box-shadow: 0 0 0 3px var(--accent), 0 0 10px 4px rgba(255, 218, 132, 0.7); }
                50% { box-shadow: 0 0 0 5px var(--accent), 0 0 15px 7px rgba(255, 218, 132, 0.7); }
                100% { box-shadow: 0 0 0 3px var(--accent), 0 0 10px 4px rgba(255, 218, 132, 0.7); }
            }
            
            @keyframes highlight-pulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 209, 102, 0.4); }
                70% { box-shadow: 0 0 0 8px rgba(255, 209, 102, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 209, 102, 0); }
            }
            
            /* Tilleggsanimasjoner */
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