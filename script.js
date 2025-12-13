// Definieer de kaart en basislaag
const map = L.map('map').setView([50.85, 4.35], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Functie om de styling van de punten (Nodes) te bepalen
function styleNodes(feature, latlng) {
    const type = feature.properties.type;
    let color = '#3388ff'; 
    let radius = 6;
    
    // Pas de kleur en grootte aan op basis van het Type
    if (type === 'Person') {
        color = '#E91E63'; // Roze
        radius = 4;
    } else if (type === 'Country') {
        color = '#4CAF50'; // Groen
        radius = 8;
    }

    return L.circleMarker(latlng, {
        radius: radius,
        fillColor: color,
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
    });
}

// Functie om de styling van de lijnen (Edges) te bepalen
function styleEdges(feature) {
    const relationship = feature.properties.relationship;
    let color = '#555555';
    let weight = 1.5; // Iets dikker gemaakt
    let dashArray = null;

    // Pas de lijnstijl aan op basis van de Relatie
    if (relationship === 'In Land') {
        color = '#FF9800'; // Oranje
        weight = 3;
    } else if (relationship === 'Stad ligt in land') {
        color = '#00BCD4'; // Blauwgroen
        weight = 1;
        dashArray = '5, 10'; // Gestippeld
    }

    return {
        color: color,
        weight: weight,
        opacity: 0.8,
        dashArray: dashArray
    };
}

// Functie om popups toe te voegen wanneer op een feature wordt geklikt
function onEachFeature(feature, layer) {
    let popupContent = "";

    if (feature.geometry.type === 'Point') {
        // Knooppunt (Point)
        popupContent = `
            <b>Knooppunt:</b> ${feature.properties.label}<br>
            <b>ID:</b> ${feature.properties.id}<br>
            <b>Type:</b> ${feature.properties.type}
        `;
    } else if (feature.geometry.type === 'LineString') {
        // Rand (LineString)
        popupContent = `
            <b>Relatie:</b> ${feature.properties.relationship}<br>
            Van: ${feature.properties.source_label || feature.properties.source_id}<br>
            Naar: ${feature.properties.target_label || feature.properties.target_id}
        `;
    }
    
    layer.bindPopup(popupContent);
}

// Gebruik de Fetch API om de GeoJSON data correct in te laden
fetch('network_data_full_final.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error('Netwerkfout bij het laden van GeoJSON: ' + response.statusText);
        }
        return response.json(); 
    })
    .then(network_data_full_final => {
        
        const geoJsonLayer = L.geoJSON(network_data_full_final, {
            
            // 1. PointToLayer wordt ALLEEN gebruikt voor Points (Nodes)
            pointToLayer: function (feature, latlng) {
                if (feature.geometry.type === 'Point') {
                    return styleNodes(feature, latlng);
                }
                return null; // Belangrijk: retourneer null voor LineStrings
            },
            
            // 2. Style wordt ALLEEN gebruikt voor LineStrings (Edges) en Polygons
            style: function(feature) {
                 if (feature.geometry.type === 'LineString') {
                    return styleEdges(feature);
                 }
                 return {}; // Belangrijk: retourneer lege stijl voor Points
            },
            
            // 3. onEachFeature voor zowel Points als LineStrings
            onEachFeature: onEachFeature
            
        }).addTo(map);

        // Pas de kaart aan om alle data in beeld te brengen
        if (network_data_full_final.features.length > 0) {
            map.fitBounds(geoJsonLayer.getBounds(), {padding: [50, 50]});
        }
    })
    .catch(error => {
        console.error('Er is een fout opgetreden bij het verwerken van de GeoJSON data:', error);
        alert('Fout bij het laden van de data. Controleer de bestandsnaam en de browserconsole (F12) voor details.');
    });
