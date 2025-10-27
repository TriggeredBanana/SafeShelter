/**
 * SafeShelter - Mobile UI Module
 * Handles mobile-specific UI interactions and functionality
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('Mobile UI: DOMContentLoaded event fired');
    console.log('Mobile UI: Window width =', window.innerWidth);
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 768;
    console.log('Mobile UI: Is mobile?', isMobile);

    // Mobile UI elements
    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    const mobileLayersBtn = document.getElementById('mobile-layers-btn');
    const mobileSearchPopup = document.getElementById('mobile-search-popup');
    const mobileLayersPopup = document.getElementById('mobile-layers-popup');
    const mobileSearchClose = document.getElementById('mobile-search-close');
    const mobileLayersClose = document.getElementById('mobile-layers-close');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileSearchSuggestions = document.getElementById('mobile-search-suggestions');

    console.log('Mobile UI: Search button exists?', !!mobileSearchBtn);
    console.log('Mobile UI: Layers button exists?', !!mobileLayersBtn);

    // Check if mobile elements exist before initializing
    if (!mobileSearchBtn || !mobileLayersBtn) {
        console.log('Mobile UI elements not found, skipping mobile initialization');
        return;
    }

    // Create backdrop for mobile layers popup
    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-layers-backdrop hidden';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2400;
        transition: opacity 0.3s ease;
        opacity: 0;
        pointer-events: none;
    `;
    document.body.appendChild(backdrop);

    // Add styles for backdrop visibility
    const backdropStyle = document.createElement('style');
    backdropStyle.textContent = `
        .mobile-layers-backdrop.hidden {
            opacity: 0 !important;
            pointer-events: none !important;
        }
        .mobile-layers-backdrop:not(.hidden) {
            opacity: 1 !important;
            pointer-events: auto !important;
        }
    `;
    document.head.appendChild(backdropStyle);

    // Mobile search button click
    if (mobileSearchBtn) {
        console.log('Mobile search button found, adding click listener');
        mobileSearchBtn.addEventListener('click', function (e) {
            console.log('Mobile search button clicked!');
            e.preventDefault();
            e.stopPropagation();
            if (mobileSearchPopup) {
                mobileSearchPopup.classList.remove('hidden');
                console.log('Search popup should be visible now');
                setTimeout(() => {
                    if (mobileSearchInput) mobileSearchInput.focus();
                }, 100);
            }
        });
    } else {
        console.warn('Mobile search button not found!');
    }

    // Mobile layers button click
    if (mobileLayersBtn) {
        console.log('Mobile layers button found, adding click listener');
        mobileLayersBtn.addEventListener('click', function (e) {
            console.log('Mobile layers button clicked!');
            e.preventDefault();
            e.stopPropagation();
            if (mobileLayersPopup) {
                mobileLayersPopup.classList.remove('hidden');
                console.log('Layers popup should be visible now');
            }
            backdrop.classList.remove('hidden');
        });
    } else {
        console.warn('Mobile layers button not found!');
    }

    // Close mobile search popup
    if (mobileSearchClose) {
        mobileSearchClose.addEventListener('click', function () {
            if (mobileSearchPopup) mobileSearchPopup.classList.add('hidden');
            if (mobileSearchInput) mobileSearchInput.value = '';
            if (mobileSearchSuggestions) mobileSearchSuggestions.innerHTML = '';
        });
    }

    // Close mobile layers popup
    if (mobileLayersClose) {
        mobileLayersClose.addEventListener('click', function () {
            if (mobileLayersPopup) mobileLayersPopup.classList.add('hidden');
            backdrop.classList.add('hidden');
        });
    }

    // Close layers popup when clicking backdrop
    backdrop.addEventListener('click', function () {
        if (mobileLayersPopup) mobileLayersPopup.classList.add('hidden');
        backdrop.classList.add('hidden');
    });

    // Close search popup when clicking outside
    if (mobileSearchPopup) {
        mobileSearchPopup.addEventListener('click', function (e) {
            if (e.target === mobileSearchPopup) {
                mobileSearchPopup.classList.add('hidden');
                if (mobileSearchInput) mobileSearchInput.value = '';
                if (mobileSearchSuggestions) mobileSearchSuggestions.innerHTML = '';
            }
        });
    }

    // Mobile search functionality
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', function () {
            const query = this.value.trim();

            if (query.length < 2) {
                mobileSearchSuggestions.innerHTML = '';
                return;
            }

            // Use Nominatim for geocoding search
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=no&limit=5`)
                .then(response => response.json())
                .then(data => {
                    mobileSearchSuggestions.innerHTML = '';

                    if (data.length === 0) {
                        mobileSearchSuggestions.innerHTML = '<li class="mobile-search-suggestion-item">Ingen resultater funnet</li>';
                        return;
                    }

                    data.forEach(item => {
                        const li = document.createElement('li');
                        li.className = 'mobile-search-suggestion-item';
                        li.textContent = item.display_name;
                        li.addEventListener('click', function () {
                            // Fly to location on map
                            if (window.map) {
                                window.map.flyTo([item.lat, item.lon], 14);
                            }
                            // Close search popup
                            mobileSearchPopup.classList.add('hidden');
                            mobileSearchInput.value = '';
                            mobileSearchSuggestions.innerHTML = '';
                        });
                        mobileSearchSuggestions.appendChild(li);
                    });
                })
                .catch(error => {
                    console.error('Search error:', error);
                });
        });
    }

    // Mobile "Finn nærmeste" buttons
    const mobileFindShelter = document.getElementById('mobile-find-shelter');
    const mobileFindStation = document.getElementById('mobile-find-station');
    const mobileFindHospital = document.getElementById('mobile-find-hospital');

    if (mobileFindShelter) {
        mobileFindShelter.addEventListener('click', function () {
            if (typeof window.findNearestShelter === 'function') {
                window.findNearestShelter();
            }
            // Close popup after action
            mobileLayersPopup.classList.add('hidden');
            backdrop.classList.add('hidden');
        });
    }

    if (mobileFindStation) {
        mobileFindStation.addEventListener('click', function () {
            if (typeof window.findNearestFireStation === 'function') {
                window.findNearestFireStation();
            }
            // Close popup after action
            mobileLayersPopup.classList.add('hidden');
            backdrop.classList.add('hidden');
        });
    }

    if (mobileFindHospital) {
        mobileFindHospital.addEventListener('click', function () {
            if (typeof window.findNearestHospital === 'function') {
                window.findNearestHospital();
            }
            // Close popup after action
            mobileLayersPopup.classList.add('hidden');
            backdrop.classList.add('hidden');
        });
    }

    // Mobile layer toggle buttons - sync with desktop toggles
    const mobileToggleShelters = document.getElementById('mobile-toggle-shelters');
    const mobileToggleFirestations = document.getElementById('mobile-toggle-firestations');
    const mobileToggleHospitals = document.getElementById('mobile-toggle-hospitals');
    const mobileToggleFloodZones = document.getElementById('mobile-toggle-flood-zones');

    // Desktop toggle buttons for reference
    const desktopToggleShelters = document.getElementById('toggle-shelters');
    const desktopToggleFirestations = document.getElementById('toggle-firestations');
    const desktopToggleHospitals = document.getElementById('toggle-hospitals');
    const desktopToggleFloodZones = document.getElementById('toggle-flood-zones');

    if (mobileToggleShelters && desktopToggleShelters) {
        mobileToggleShelters.addEventListener('click', function () {
            desktopToggleShelters.click(); // Trigger desktop toggle
            this.classList.toggle('active');
        });
    }

    if (mobileToggleFirestations && desktopToggleFirestations) {
        mobileToggleFirestations.addEventListener('click', function () {
            desktopToggleFirestations.click(); // Trigger desktop toggle
            this.classList.toggle('fire-active');
        });
    }

    if (mobileToggleHospitals && desktopToggleHospitals) {
        mobileToggleHospitals.addEventListener('click', function () {
            desktopToggleHospitals.click(); // Trigger desktop toggle
            this.classList.toggle('hospital-active');
        });
    }

    if (mobileToggleFloodZones && desktopToggleFloodZones) {
        mobileToggleFloodZones.addEventListener('click', function () {
            desktopToggleFloodZones.click(); // Trigger desktop toggle
            this.classList.toggle('active');
        });
    }

    // Mobile map style buttons
    const mobileMapStyleButtons = document.querySelectorAll('.mobile-map-style');

    mobileMapStyleButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons
            mobileMapStyleButtons.forEach(b => b.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Change map style
            const style = button.getAttribute('data-style');
            if (typeof window.changeMapStyle === 'function') {
                window.changeMapStyle(style);
            }
        });
    });

    // Sync mobile status indicators with desktop status
    function updateMobileStatus() {
        const fireStatus = document.getElementById('fire-status');
        const weatherStatus = document.getElementById('weather-status');
        const floodStatus = document.getElementById('flood-status');

        const mobileFireStatus = document.getElementById('mobile-fire-status');
        const mobileWeatherStatus = document.getElementById('mobile-weather-status');
        const mobileFloodStatus = document.getElementById('mobile-flood-status');

        // Only update if both desktop and mobile elements exist
        if (fireStatus && mobileFireStatus) {
            const parentStatus = fireStatus.closest('.status-item');
            if (parentStatus) {
                const statusClass = parentStatus.classList.contains('status-warning') ? 'status-warning' :
                    parentStatus.classList.contains('status-alert') ? 'status-alert' : 'status-ok';
                mobileFireStatus.className = 'mobile-status-item ' + statusClass;
            }
        }

        if (weatherStatus && mobileWeatherStatus) {
            const parentStatus = weatherStatus.closest('.status-item');
            if (parentStatus) {
                const statusClass = parentStatus.classList.contains('status-warning') ? 'status-warning' :
                    parentStatus.classList.contains('status-alert') ? 'status-alert' : 'status-ok';
                mobileWeatherStatus.className = 'mobile-status-item ' + statusClass;
            }
        }

        if (floodStatus && mobileFloodStatus) {
            const parentStatus = floodStatus.closest('.status-item');
            if (parentStatus) {
                const statusClass = parentStatus.classList.contains('status-warning') ? 'status-warning' :
                    parentStatus.classList.contains('status-alert') ? 'status-alert' : 'status-ok';
                mobileFloodStatus.className = 'mobile-status-item ' + statusClass;
            }
        }
    }

    // Update mobile status periodically only if elements exist
    if (document.getElementById('mobile-fire-status')) {
        updateMobileStatus();
        setInterval(updateMobileStatus, 5000); // Update every 5 seconds
    }

    // Handle window resize to check if still mobile
    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            const isNowMobile = window.innerWidth <= 768;
            if (!isNowMobile) {
                // Switched to desktop, close any open mobile popups
                if (mobileSearchPopup) mobileSearchPopup.classList.add('hidden');
                if (mobileLayersPopup) mobileLayersPopup.classList.add('hidden');
                backdrop.classList.add('hidden');
            }
        }, 250);
    });

    console.log('Mobile UI initialized successfully');
});
