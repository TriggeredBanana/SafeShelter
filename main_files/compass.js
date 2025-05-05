// SafeShelter Compass Control
L.Control.Compass = L.Control.extend({
    options: {
        position: 'bottomleft'
    },
    
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control-compass');
        
        // Create compass rose element with cardinal directions
        const compassRose = L.DomUtil.create('div', 'compass-rose', container);
        
        // Add cardinal direction labels
        const directions = [
            {class: 'compass-north', text: 'N'},
            {class: 'compass-east', text: 'Ø'},
            {class: 'compass-south', text: 'S'},
            {class: 'compass-west', text: 'V'},
            {class: 'compass-ne', text: 'NØ'},
            {class: 'compass-nw', text: 'NV'},
            {class: 'compass-se', text: 'SØ'},
            {class: 'compass-sw', text: 'SV'}
        ];
        
        directions.forEach(dir => {
            const dirElement = L.DomUtil.create('div', `compass-direction ${dir.class}`, compassRose);
            dirElement.textContent = dir.text;
        });
        
        // Create needle pointer
        const needle = L.DomUtil.create('div', 'compass-needle', compassRose);
        
        // Add center dot
        const center = L.DomUtil.create('div', 'compass-center', compassRose);
        
        // Add outer ring
        const ring = L.DomUtil.create('div', 'compass-ring', compassRose);
        
        // Show direction on hover
        L.DomEvent.addListener(container, 'mouseover', function() {
            container.title = 'Kompass - klikk for å tilbakestille retning';
        });
        
        L.DomEvent.addListener(container, 'mouseout', function() {
            container.title = '';
        });
        
        // Reset map rotation when clicking the compass
        L.DomEvent.addListener(container, 'click', function() {
            map.setBearing(0);
            if (window.showNotification) {
                showNotification('Kartretning tilbakestilt til nord', 'info');
            }
        });
        
        // Set initial rotation
        this._compassRose = compassRose;
        this._map = map;
        
        // Listen for rotation changes
        map.on('rotate', this._onRotate, this);
        
        return container;
    },
    
    onRemove: function(map) {
        map.off('rotate', this._onRotate, this);
    },
    
    _onRotate: function(e) {
        // Update compass rose rotation to show correct orientation
        if (this._compassRose) {
            this._compassRose.style.transform = `rotate(${-e.bearing}deg)`;
        }
    }
});

L.control.compass = function(options) {
    return new L.Control.Compass(options);
};

// Add setBearing method to Leaflet's map if it doesn't exist
if (!L.Map.prototype.setBearing) {
    L.Map.prototype.setBearing = function(bearing) {
        // Most maps don't support rotation, but this sets up the API
        this.fire('rotate', { bearing: bearing });
        return this;
    };
}

// Initialize immediately and directly
document.addEventListener('DOMContentLoaded', function() {
    // Add a direct initialization attempt 
    setTimeout(function() {
        if (window.map) {
            console.log("Adding compass to map");
            const compassControl = L.control.compass().addTo(window.map);
            window.map.setBearing(0);
        }
    }, 1000);
});