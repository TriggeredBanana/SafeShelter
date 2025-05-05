/**
 * SafeShelter - Registration Controller
 * Handles user registration for emergency notifications
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const registrationForm = document.getElementById('registration-form');
    const progressSteps = document.querySelectorAll('.progress-step');
    const formSteps = document.querySelectorAll('.form-step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const locationOptions = document.querySelectorAll('.option-card');
    const locationForms = document.querySelectorAll('.location-form');
    const successModal = document.getElementById('success-modal');
    
    // Form input elements
    // const fullNameInput = document.getElementById('fullname');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const privacyConsent = document.getElementById('privacy-consent');
    
    // County and municipality selects
    const countySelect = document.getElementById('county');
    const municipalitySelect = document.getElementById('municipality');
    
    // GPS toggle elements
    const gpsToggle = document.getElementById('gps-toggle');
    const gpsBackgroundToggle = document.getElementById('gps-background-toggle');
    
    // Initialize form functionality
    initializeForm();
    
    // Main initialization function
    function initializeForm() {
        setupProgressNavigation();
        setupLocationOptions();
        setupCountyMunicipalityRelationship();
        setupFormValidation();
        enhanceFormFields();
        setupModalButtons();
        populateNotificationCards();
        populateMethodCards();
        setupPrivacyContent();
    }
    
    // Setup navigation between form steps
    function setupProgressNavigation() {
        // Next button handlers
        nextButtons.forEach(button => {
            button.addEventListener('click', function() {
                const currentStep = this.closest('.form-step');
                const currentStepIndex = Array.from(formSteps).indexOf(currentStep);
                
                // Validate current step before proceeding
                if (validateStep(currentStepIndex)) {
                    // Update progress bar
                    progressSteps[currentStepIndex].classList.add('complete');
                    progressSteps[currentStepIndex + 1].classList.add('active');
                    
                    if (currentStepIndex < formSteps.length - 1) {
                        // Update progress bars between steps
                        const progressBars = document.querySelectorAll('.progress-bar');
                        if (currentStepIndex < progressBars.length) {
                            progressBars[currentStepIndex].classList.add('active');
                        }
                        
                        // Hide current step
                        currentStep.classList.remove('active');
                        
                        // Show next step
                        formSteps[currentStepIndex + 1].classList.add('active');
                        
                        // Scroll to top of form
                        window.scrollTo({
                            top: document.querySelector('.register-section').offsetTop - 20,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
        
        // Previous button handlers
        prevButtons.forEach(button => {
            button.addEventListener('click', function() {
                const currentStep = this.closest('.form-step');
                const currentStepIndex = Array.from(formSteps).indexOf(currentStep);
                
                if (currentStepIndex > 0) {
                    // Update progress
                    progressSteps[currentStepIndex].classList.remove('active');
                    progressSteps[currentStepIndex - 1].classList.remove('complete');
                    
                    // Update progress bars between steps
                    const progressBars = document.querySelectorAll('.progress-bar');
                    if (currentStepIndex - 1 < progressBars.length) {
                        progressBars[currentStepIndex - 1].classList.remove('active');
                    }
                    
                    // Hide current step
                    currentStep.classList.remove('active');
                    
                    // Show previous step
                    formSteps[currentStepIndex - 1].classList.add('active');
                    
                    // Scroll to top of form
                    window.scrollTo({
                        top: document.querySelector('.register-section').offsetTop - 20,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // Validate each form step
    function validateStep(stepIndex) {
        switch(stepIndex) {
            case 0: // Contact information step
                return validateContactStep();
            case 1: // Location preferences step
                return validateLocationStep();
            case 2: // Notification settings step
                return validateNotificationStep();
            default:
                return true;
        }
    }
    
    // Validate contact information step
    function validateContactStep() {
        // Name is required
        /** if (fullNameInput.value.trim() === '') {
            showValidationError(fullNameInput, 'Vennligst fyll inn ditt navn');
            return false;
        } */
        
        // Either phone or email should be provided
        if (phoneInput.value.trim() === '' && emailInput.value.trim() === '') {
            showValidationError(emailInput, 'Vennligst oppgi enten telefon eller e-post');
            showValidationError(phoneInput, 'Vennligst oppgi enten telefon eller e-post');
            return false;
        }
        
        // Validate phone format if provided
        if (phoneInput.value.trim() !== '') {
            // Remove all non-digits for validation
            const cleanNumber = phoneInput.value.replace(/\D/g, '');
            
            // Check if it's a valid Norwegian phone number (8 digits, or with country code)
            if (!(cleanNumber.length === 8 || (cleanNumber.length > 8 && cleanNumber.length <= 12))) {
                showValidationError(phoneInput, 'Vennligst oppgi et gyldig telefonnummer');
                return false;
            }
        }
        
        // Validate email format if provided
        if (emailInput.value.trim() !== '') {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value.trim())) {
                showValidationError(emailInput, 'Vennligst oppgi en gyldig e-postadresse');
                return false;
            }
        }
        
        // Clear any existing validation errors
        // clearValidationError(fullNameInput);
        clearValidationError(phoneInput);
        clearValidationError(emailInput);
        
        return true;
    }
    
    // Validate location preferences step
    function validateLocationStep() {
        const selectedOption = document.querySelector('.option-card.selected');
        
        // Make sure a location option is selected
        if (!selectedOption) {
            showNotification('Vennligst velg en lokaliseringsmetode', 'error');
            return false;
        }
        
        const optionType = selectedOption.getAttribute('data-option');
        
        // Validate based on selected option type
        switch(optionType) {
            case 'home-address':
                return validateHomeAddress();
            case 'area':
                return validateArea();
            case 'gps':
                return validateGPS();
            default:
                return false;
        }
    }
    
    // Validate home address form
    function validateHomeAddress() {
        const street = document.getElementById('street');
        const postalCode = document.getElementById('postal-code');
        const city = document.getElementById('city');
        
        let isValid = true;
        
        if (street.value.trim() === '') {
            showValidationError(street, 'Vennligst fyll inn gateadresse');
            isValid = false;
        } else {
            clearValidationError(street);
        }
        
        if (postalCode.value.trim() === '') {
            showValidationError(postalCode, 'Vennligst fyll inn postnummer');
            isValid = false;
        } else {
            // Validate Norwegian postal code (4 digits)
            const postalCodePattern = /^\d{4}$/;
            if (!postalCodePattern.test(postalCode.value.trim())) {
                showValidationError(postalCode, 'Postnummer må bestå av 4 siffer');
                isValid = false;
            } else {
                clearValidationError(postalCode);
            }
        }
        
        if (city.value.trim() === '') {
            showValidationError(city, 'Vennligst fyll inn by');
            isValid = false;
        } else {
            clearValidationError(city);
        }
        
        return isValid;
    }
    
    // Validate area form
    function validateArea() {
        const county = document.getElementById('county');
        const municipality = document.getElementById('municipality');
        
        let isValid = true;
        
        if (county.value === '') {
            showValidationError(county, 'Vennligst velg et fylke');
            isValid = false;
        } else {
            clearValidationError(county);
        }
        
        if (municipality.value === '') {
            showValidationError(municipality, 'Vennligst velg en kommune');
            isValid = false;
        } else {
            clearValidationError(municipality);
        }
        
        return isValid;
    }
    
    // Validate GPS form
    function validateGPS() {
        // Check if GPS tracking is enabled
        if (!gpsToggle.checked) {
            showValidationError(gpsToggle.parentNode, 'Aktiver GPS-sporing for å fortsette');
            return false;
        } else {
            clearValidationError(gpsToggle.parentNode);
        }
        
        return true;
    }
    
    // Validate notification step
    function validateNotificationStep() {
        // Privacy consent is required
        if (!privacyConsent.checked) {
            showValidationError(privacyConsent.parentNode, 'Du må godta personvernerklæringen for å fortsette');
            return false;
        } else {
            clearValidationError(privacyConsent.parentNode);
        }
        
        return true;
    }
    
    // Set up location option selection functionality
    function setupLocationOptions() {
        // Location option selection
        locationOptions.forEach(option => {
            // Fully populate option cards with content
            populateOptionCard(option);
            
            option.addEventListener('click', function() {
                // Remove selection from all options
                locationOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selection to clicked option
                this.classList.add('selected');
                
                // Hide all location forms
                locationForms.forEach(form => form.classList.remove('active'));
                
                // Show relevant form based on option
                const optionType = this.getAttribute('data-option');
                const relevantForm = document.getElementById(`${optionType}-form`);
                if (relevantForm) {
                    relevantForm.classList.add('active');
                }
                
                // If GPS option, request location permission
                if (optionType === 'gps' && gpsToggle.checked) {
                    requestLocationPermission();
                }
            });
        });
        
        // GPS toggle event
        gpsToggle.addEventListener('change', function() {
            if (this.checked) {
                requestLocationPermission();
            }
        });
    }
    
    // Populate location option cards with content
    function populateOptionCard(card) {
        const optionType = card.getAttribute('data-option');
        const icon = card.querySelector('.option-icon');
        const content = card.querySelector('.option-content');
        
        switch(optionType) {
            case 'home-address':
                icon.innerHTML = '<i class="fas fa-home"></i>';
                content.innerHTML = `
                    <h4>Hjemmeadresse</h4>
                    <p>Motta varsler for din hjemmeadresse</p>
                `;
                break;
            case 'area':
                icon.innerHTML = '<i class="fas fa-map"></i>';
                content.innerHTML = `
                    <h4>Geografisk område</h4>
                    <p>Motta varsler for et større geografisk område</p>
                `;
                break;
            case 'gps':
                icon.innerHTML = '<i class="fas fa-location-dot"></i>';
                content.innerHTML = `
                    <h4>GPS-sporing</h4>
                    <p>Motta varsler basert på din nåværende posisjon</p>
                `;
                break;
        }
    }
    
    // Request location permission for GPS tracking
    function requestLocationPermission() {
        if ('geolocation' in navigator) {
            navigator.permissions.query({name:'geolocation'}).then(function(result) {
                if (result.state === 'granted') {
                    showNotification('GPS-tilgang er allerede aktivert', 'success');
                } else if (result.state === 'prompt') {
                    showNotification('Vi vil be om tilgang til din lokasjon ved registrering', 'info');
                } else if (result.state === 'denied') {
                    showNotification('GPS-tilgang er avslått. Vennligst aktiver posisjonstilgang i nettleserinnstillingene', 'error');
                    gpsToggle.checked = false;
                }
            });
        } else {
            showNotification('Enheten din støtter ikke geolokalisering', 'error');
            gpsToggle.checked = false;
        }
    }
    
    // Set up county/municipality relationship
    function setupCountyMunicipalityRelationship() {
        // Norwegian municipalities by county
        const municipalities = {
            'agder': ['Arendal', 'Birkenes', 'Bygland', 'Bykle', 'Evje og Hornnes', 'Farsund', 'Flekkefjord', 'Froland', 'Gjerstad', 'Grimstad', 'Hægebostad', 'Iveland', 'Kristiansand', 'Kvinesdal', 'Lillesand', 'Lindesnes', 'Lyngdal', 'Risør', 'Sirdal', 'Tvedestrand', 'Valle', 'Vegårshei', 'Vennesla', 'Åmli', 'Åseral'],
            'innlandet': ['Alvdal', 'Dovre', 'Eidskog', 'Elverum', 'Engerdal', 'Etnedal', 'Folldal', 'Gausdal', 'Gjøvik', 'Gran', 'Grue', 'Hamar', 'Kongsvinger', 'Lesja', 'Lillehammer', 'Lom', 'Løten', 'Nord-Aurdal', 'Nord-Fron', 'Nord-Odal', 'Nordre Land', 'Os', 'Rendalen', 'Ringebu', 'Ringsaker', 'Sel', 'Skjåk', 'Stange', 'Stor-Elvdal', 'Søndre Land', 'Sør-Aurdal', 'Sør-Fron', 'Sør-Odal', 'Tolga', 'Trysil', 'Tynset', 'Vang', 'Vestre Slidre', 'Vestre Toten', 'Vågå', 'Våler', 'Øyer', 'Østre Toten', 'Åmot', 'Åsnes'],
            'more-romsdal': ['Aukra', 'Aure', 'Averøy', 'Fjord', 'Giske', 'Gjemnes', 'Hareid', 'Herøy', 'Hustadvika', 'Kristiansund', 'Molde', 'Rauma', 'Sande', 'Smøla', 'Stranda', 'Sula', 'Sunndal', 'Surnadal', 'Sykkylven', 'Tingvoll', 'Ulstein', 'Vanylven', 'Vestnes', 'Volda', 'Ålesund'],
            'nordland': ['Alstahaug', 'Andøy', 'Beiarn', 'Bindal', 'Bodø', 'Brønnøy', 'Bø', 'Dønna', 'Evenes', 'Fauske', 'Flakstad', 'Gildeskål', 'Grane', 'Hadsel', 'Hamarøy', 'Hattfjelldal', 'Hemnes', 'Herøy', 'Leirfjord', 'Lurøy', 'Lødingen', 'Meløy', 'Moskenes', 'Narvik', 'Nesna', 'Rana', 'Rødøy', 'Røst', 'Saltdal', 'Sortland', 'Steigen', 'Sømna', 'Sørfold', 'Træna', 'Vefsn', 'Vega', 'Vestvågøy', 'Vevelstad', 'Værøy', 'Vågan', 'Øksnes'],
            'oslo': ['Oslo'],
            'rogaland': ['Bjerkreim', 'Bokn', 'Eigersund', 'Gjesdal', 'Haugesund', 'Hjelmeland', 'Hå', 'Karmøy', 'Klepp', 'Kvitsøy', 'Lund', 'Randaberg', 'Sandnes', 'Sauda', 'Sokndal', 'Sola', 'Stavanger', 'Strand', 'Suldal', 'Time', 'Tysvær', 'Utsira', 'Vindafjord'],
            'vestfold-telemark': ['Bamble', 'Drangedal', 'Færder', 'Fyresdal', 'Holmestrand', 'Horten', 'Kragerø', 'Kviteseid', 'Larvik', 'Midt-Telemark', 'Nissedal', 'Nome', 'Porsgrunn', 'Sandefjord', 'Seljord', 'Siljan', 'Skien', 'Tinn', 'Tokke', 'Tønsberg', 'Vinje'],
            'troms-finnmark': ['Alta', 'Balsfjord', 'Bardu', 'Berlevåg', 'Båtsfjord', 'Dyrøy', 'Gamvik', 'Gratangen', 'Hammerfest', 'Harstad', 'Hasvik', 'Ibestad', 'Karasjok', 'Karlsøy', 'Kautokeino', 'Kvæfjord', 'Kvænangen', 'Kåfjord', 'Lavangen', 'Lebesby', 'Loppa', 'Lyngen', 'Målselv', 'Måsøy', 'Nesseby', 'Nordkapp', 'Nordreisa', 'Porsanger', 'Salangen', 'Senja', 'Skjervøy', 'Sør-Varanger', 'Storfjord', 'Sørreisa', 'Tana', 'Tjeldsund', 'Tromsø', 'Vardø'],
            'trondelag': ['Flatanger', 'Frosta', 'Frøya', 'Grong', 'Heim', 'Hitra', 'Holtålen', 'Høylandet', 'Inderøy', 'Indre Fosen', 'Leka', 'Levanger', 'Lierne', 'Malvik', 'Melhus', 'Meråker', 'Midtre Gauldal', 'Namsos', 'Namsskogan', 'Nærøysund', 'Oppdal', 'Orkland', 'Osen', 'Overhalla', 'Rennebu', 'Røros', 'Røyrvik', 'Selbu', 'Skaun', 'Snåsa', 'Steinkjer', 'Stjørdal', 'Trondheim', 'Tydal', 'Verdal', 'Åfjord'],
            'vestland': ['Alver', 'Askvoll', 'Askøy', 'Aurland', 'Austevoll', 'Austrheim', 'Bergen', 'Bjørnafjorden', 'Bremanger', 'Bømlo', 'Eidfjord', 'Etne', 'Fedje', 'Fitjar', 'Fjaler', 'Gloppen', 'Gulen', 'Hyllestad', 'Høyanger', 'Kinn', 'Kvam', 'Kvinnherad', 'Luster', 'Lærdal', 'Masfjorden', 'Modalen', 'Osterøy', 'Samnanger', 'Sogndal', 'Solund', 'Stad', 'Stord', 'Stryn', 'Sunnfjord', 'Sveio', 'Tysnes', 'Ullensvang', 'Ulvik', 'Vaksdal', 'Voss', 'Øygarden', 'Årdal'],
            'viken': ['Aremark', 'Asker', 'Aurskog-Høland', 'Bærum', 'Drammen', 'Eidsvoll', 'Enebakk', 'Flå', 'Fredrikstad', 'Frogn', 'Gjerdrum', 'Gol', 'Halden', 'Hemsedal', 'Hol', 'Hole', 'Hurdal', 'Hvaler', 'Indre Østfold', 'Jevnaker', 'Kongsberg', 'Krødsherad', 'Lier', 'Lillestrøm', 'Lunner', 'Lørenskog', 'Marker', 'Modum', 'Moss', 'Nannestad', 'Nes', 'Nesbyen', 'Nesodden', 'Nittedal', 'Nordre Follo', 'Nore og Uvdal', 'Rakkestad', 'Ringerike', 'Rollag', 'Råde', 'Rælingen', 'Sarpsborg', 'Sigdal', 'Skiptvet', 'Ullensaker', 'Vestby', 'Våler', 'Øvre Eiker', 'Ål', 'Ås']
        };
        
        // When county changes, update municipality options
        countySelect.addEventListener('change', function() {
            const selectedCounty = this.value;
            municipalitySelect.innerHTML = '<option value="" disabled selected>Velg kommune</option>';
            
            if (selectedCounty && municipalities[selectedCounty]) {
                // Add municipalities for selected county
                municipalities[selectedCounty].forEach(muni => {
                    const option = document.createElement('option');
                    option.value = muni.toLowerCase().replace(' ', '-');
                    option.textContent = muni;
                    municipalitySelect.appendChild(option);
                });
                
                // Enable municipality select
                municipalitySelect.disabled = false;
            } else {
                // Disable municipality select if no county selected
                municipalitySelect.disabled = true;
            }
        });
    }
    
    // Enhance form fields with additional functionality
    function enhanceFormFields() {
        // Populate notification fields, add focus events, etc.
        const formFields = document.querySelectorAll('input, select, textarea');
        
        formFields.forEach(field => {
            // Add focus and blur events for visual feedback
            field.addEventListener('focus', function() {
                this.closest('.form-group')?.classList.add('form-group-focus');
            });
            
            field.addEventListener('blur', function() {
                this.closest('.form-group')?.classList.remove('form-group-focus');
            });
            
            // Auto-format phone number
            if (field.id === 'phone') {
                field.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\D/g, '');
                    
                    // Format as Norwegian phone number if it looks like one
                    if (value.length > 0) {
                        if (value.length <= 8) {
                            // Format as XX XX XX XX
                            value = value.replace(/(\d{2})(?=\d)/g, '$1 ');
                        } else {
                            // Add country code for longer numbers
                            value = '+' + value.substring(0, 2) + ' ' + value.substring(2).replace(/(\d{2})(?=\d)/g, '$1 ');
                        }
                    }
                    
                    e.target.value = value;
                });
            }
            
            // Auto-format postal code
            if (field.id === 'postal-code') {
                field.addEventListener('input', function(e) {
                    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
                });
            }
        });
        
        // Make privacy consent link open in a new tab
        document.querySelector('.privacy-link')?.addEventListener('click', function(e) {
            e.preventDefault();
            window.open('https://www.datatilsynet.no/rettigheter-og-plikter/den-registrertes-rettigheter/', '_blank');
        });
    }
    
    // Setup form validation
    function setupFormValidation() {
        // Form submission handler
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Final validation
            if (validateContactStep() && validateLocationStep() && validateNotificationStep()) {
                // Gather form data for submission
                const formData = collectFormData();
                
                // In a real app, send to server
                // fetch('/api/register', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json'
                //     },
                //     body: JSON.stringify(formData)
                // })
                // .then(response => response.json())
                // .then(data => {
                //     if (data.success) {
                //         showSuccessModal();
                //     } else {
                //         showNotification('Registrering feilet: ' + data.error, 'error');
                //     }
                // })
                // .catch(error => {
                //     showNotification('En feil oppstod: ' + error.message, 'error');
                // });
                
                // For demo purposes, show success immediately
                showSuccessModal(formData);
            }
        });
    }
    
    // Collect all form data for submission
    function collectFormData() {
        const formData = {
            personalInfo: {
                // name: fullNameInput.value.trim(),
                phone: phoneInput.value.trim(),
                email: emailInput.value.trim()
            },
            locationPreference: null,
            notificationSettings: {
                types: [], // Would collect from notification cards
                methods: {
                    sms: phoneInput.value.trim() !== '',
                    email: emailInput.value.trim() !== '',
                    app: false // Would be true if app option was selected
                }
            }
        };
        
        // Get selected location preference
        const selectedOption = document.querySelector('.option-card.selected');
        if (selectedOption) {
            const optionType = selectedOption.getAttribute('data-option');
            
            switch(optionType) {
                case 'home-address':
                    formData.locationPreference = {
                        type: 'address',
                        street: document.getElementById('street').value.trim(),
                        postalCode: document.getElementById('postal-code').value.trim(),
                        city: document.getElementById('city').value.trim()
                    };
                    break;
                case 'area':
                    formData.locationPreference = {
                        type: 'area',
                        county: document.getElementById('county').value,
                        municipality: document.getElementById('municipality').value
                    };
                    break;
                case 'gps':
                    formData.locationPreference = {
                        type: 'gps',
                        enabled: gpsToggle.checked,
                        backgroundTracking: gpsBackgroundToggle.checked
                    };
                    break;
            }
        }
        
        return formData;
    }
    
    // Show success modal with user details
    function showSuccessModal(formData) {
        // Update confirmation details
        document.getElementById('confirm-email').textContent = formData.personalInfo.email || '(Ingen e-post registrert)';
        document.getElementById('confirm-phone').textContent = formData.personalInfo.phone || '(Ingen telefon registrert)';
        
        // Show the modal
        successModal.classList.remove('hidden');
        
        // In a real application, we might save to localStorage, send to server, etc.
        localStorage.setItem('safetyRegistration', JSON.stringify({
            registered: true,
            name: formData.personalInfo.name,
            timestamp: new Date().toISOString()
        }));
    }
    
    // Setup modal button actions
    function setupModalButtons() {
        document.getElementById('go-to-home')?.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Populate notification category cards
    function populateNotificationCards() {
        const notificationCards = document.querySelectorAll('.notification-card');
        
        // Notification types data
        const notificationTypes = [
            {
                icon: 'fa-fire',
                type: 'danger',
                title: 'Brann',
                description: 'Skogbranner, bygningsbranner og andre brannfarer i nærheten.'
            },
            {
                icon: 'fa-water',
                type: 'secondary',
                title: 'Flom',
                description: 'Oversvømmelser, høy vannstand og flomvarsel for elver og vassdrag.'
            },
            {
                icon: 'fas fa-bolt',
                type: 'primary',
                title: 'Ekstremvær',
                description: 'Kraftig vind, storm, orkan, kraftig regn og andre ekstreme værsituasjoner.'
            },
            {
                icon: 'fa-mountain',
                type: 'secondary',
                title: 'Skred',
                description: 'Fare for jord-, snø- og steinskred i ditt område.'
            },
            {
                icon: 'fa-tower-broadcast',
                type: 'primary',
                title: 'Infrastruktur',
                description: 'Brudd på strøm, vann, telefonlinjer eller veier.'
            },
            {
                icon: 'fa-triangle-exclamation',
                type: 'danger',
                title: 'Nødvarsler',
                description: 'Generelle nødvarsler fra myndighetene.'
            }
        ];
        
        // Populate each card with notification type information
        notificationCards.forEach((card, index) => {
            if (index < notificationTypes.length) {
                const type = notificationTypes[index];
                
                card.querySelector('.card-header').innerHTML = `
                    <div class="notification-icon ${type.type}">
                        <i class="fas ${type.icon}"></i>
                    </div>
                    <h4>${type.title}</h4>
                `;
                
                card.querySelector('.card-content').innerHTML = `
                    <p>${type.description}</p>
                `;
                
                // Make card clickable with selected state
                card.style.cursor = 'pointer';
                card.dataset.selected = 'false';
                
                // Add toggle functionality
                card.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    this.dataset.selected = this.classList.contains('selected') ? 'true' : 'false';
                });
            }
        });
    }
    
    // Populate notification method cards
    function populateMethodCards() {
        const methodCards = document.querySelectorAll('.method-card');
        
        // Notification methods data
        const methods = [
            {
                icon: 'fa-comment',
                title: 'SMS',
                description: 'Motta varsler via tekstmelding'
            },
            {
                icon: 'fa-envelope',
                title: 'E-post',
                description: 'Motta varsler via e-post'
            },
            {
                icon: 'fa-bell',
                title: 'Push-varsler',
                description: 'Motta varsler direkte på enheten din'
            }
        ];
        
        // Populate each card with method information
        methodCards.forEach((card, index) => {
            if (index < methods.length) {
                const method = methods[index];
                
                card.innerHTML = `
                    <div class="method-icon">
                        <i class="fas ${method.icon}"></i>
                    </div>
                    <div class="method-details">
                        <h4>${method.title}</h4>
                        <p class="method-description">${method.description}</p>
                    </div>
                `;
                
                // Make card clickable with selected state
                card.style.cursor = 'pointer';
                card.dataset.selected = 'false';
                
                // Add toggle functionality
                card.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    this.dataset.selected = this.classList.contains('selected') ? 'true' : 'false';
                });
            }
        });
    }
    
    // Populate privacy content in the GPS form
    function setupPrivacyContent() {
        const privacyNote = document.querySelector('.privacy-note');
        if (privacyNote) {
            privacyNote.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>Din lokasjon brukes kun til å gi deg relevante varsler og lagres aldri uten ditt samtykke. Du kan når som helst deaktivere sporingstjenesten.</span>
            `;
        }
    }
    
    // Display validation error for a field
    function showValidationError(element, message) {
        // Remove any existing error
        clearValidationError(element);
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.textContent = message;
        
        // Insert after the element or its parent for checkboxes
        if (element.type === 'checkbox') {
            element.parentNode.after(errorDiv);
        } else {
            element.after(errorDiv);
        }
        
        // Highlight the element
        if (element.classList) {
            element.classList.add('error');
        } else {
            element.parentNode.classList.add('error');
        }
    }
    
    // Clear validation error for a field
    function clearValidationError(element) {
        // Find the parent container
        const container = element.type === 'checkbox' ? element.parentNode.parentNode : element.parentNode;
        
        // Remove error class
        if (element.classList) {
            element.classList.remove('error');
        } else if (element.parentNode.classList) {
            element.parentNode.classList.remove('error');
        }
        
        // Remove error message
        const errors = container.querySelectorAll('.validation-error');
        errors.forEach(error => error.remove());
    }
    
    // Show notification message
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${getIconForType(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('slide-in');
        }, 10);
        
        // Automatically remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('slide-in');
            notification.classList.add('slide-out');
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Helper function for notification icons
        function getIconForType(type) {
            switch (type) {
                case 'success': return 'fa-check-circle';
                case 'error': return 'fa-exclamation-circle';
                case 'warning': return 'fa-exclamation-triangle';
                case 'info':
                default: return 'fa-info-circle';
            }
        }
    }
});