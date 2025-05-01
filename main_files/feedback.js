document.addEventListener('DOMContentLoaded', function() {
    // Initialize maps
    let locationMap;
    let selectedLocationMarker = null;
    
    // DOM elements
    const reportForm = document.getElementById('safety-report-form');
    const descriptionField = document.getElementById('report-description');
    const charCount = document.getElementById('char-count');
    const imagePreview = document.getElementById('image-preview');
    const photoUpload = document.getElementById('report-photo');
    const photoFilename = document.getElementById('photo-filename');
    const contactToggle = document.getElementById('contact-toggle');
    const contactFields = document.getElementById('contact-fields');
    const confirmationModal = document.getElementById('confirmation-modal');
    const useMyLocationBtn = document.getElementById('use-my-location');
    
    // Initialize the application
    initializeApp();
    
    // Main initialization function
    function initializeApp() {
        initializeLocationMap();
        setupEventListeners();
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
            window.location.href = 'activeReports.html';
        });
        
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

        // Address autofill functionality
        const locationAddressField = document.getElementById('location-address');
        const addressSuggestions = document.getElementById('address-suggestions');

        locationAddressField.addEventListener('input', debounce(function() {
            const query = this.value.trim();
            
            // Clear suggestions if query is too short
            if (query.length < 3) {
                addressSuggestions.innerHTML = '';
                addressSuggestions.classList.add('hidden');
                return;
            }
            
            // Fetch address suggestions
            fetchAddressSuggestions(query);
        }, 300));

        // Close suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== locationAddressField && e.target !== addressSuggestions) {
                addressSuggestions.classList.add('hidden');
            }
        });

        // Fetch address suggestions from Nominatim
        async function fetchAddressSuggestions(query) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();
                displayAddressSuggestions(data);
            } catch (error) {
                console.error('Error fetching address suggestions:', error);
            }
        }

        // Display address suggestions in dropdown
        function displayAddressSuggestions(suggestions) {
            // Clear previous suggestions
            addressSuggestions.innerHTML = '';
            
            if (suggestions.length === 0) {
                addressSuggestions.classList.add('hidden');
                return;
            }
            
            // Create suggestion items
            suggestions.forEach(place => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = place.display_name;
                
                // When clicked, set the location
                item.addEventListener('click', function() {
                    // Update input field
                    locationAddressField.value = place.display_name;
                    
                    // Set map location
                    setSelectedLocation(
                        parseFloat(place.lat),
                        parseFloat(place.lon)
                    );
                    
                    // Hide suggestions
                    addressSuggestions.classList.add('hidden');
                });
                
                addressSuggestions.appendChild(item);
            });
            
            // Show suggestions
            addressSuggestions.classList.remove('hidden');
        }

        // Add debounce utility function if not already present
        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    func.apply(context, args);
                }, wait);
            };
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
                    
                    // Set the selected location
                    setSelectedLocation(lat, lng);
                    
                    // Re-enable the button
                    useMyLocationBtn.disabled = false;
                    useMyLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Bruk min posisjon';
                },
                function(error) {
                    console.error('Geolocation error:', error);
                    
                    // Re-enable the button
                    useMyLocationBtn.disabled = false;
                    useMyLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Bruk min posisjon';
                    
                    // Show error message based on error code
                    let errorMsg;
                    switch(error.code) {
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
                    
                    alert(errorMsg);
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
            hasPhoto: document.getElementById('report-photo').files.length > 0
        };
        
        // Save report to localStorage
        saveReportToLocalStorage(report);
        
        // Show confirmation modal
        document.getElementById('report-id').textContent = report.id;
        confirmationModal.classList.remove('hidden');
    }
    
    // Add new function to save reports to localStorage
    function saveReportToLocalStorage(report) {
        // Get existing reports from localStorage or initialize empty array
        const existingReports = JSON.parse(localStorage.getItem('safetyReports') || '[]');
        
        // Add new report
        existingReports.push(report);
        
        // Save back to localStorage
        localStorage.setItem('safetyReports', JSON.stringify(existingReports));
        
        console.log('Report saved to localStorage:', report);
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
});