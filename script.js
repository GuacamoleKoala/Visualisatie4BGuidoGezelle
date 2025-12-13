// Definieer de kaart en basislaag (dit blijft hetzelfde)
const map = L.map('map').setView([50.85, 4.35], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);


// NIEUW: Gebruik de Fetch API om de GeoJSON data correct in te laden
fetch('network_data_full_final.geojson')
    .then(response => {
        // Controleer op netwerkfouten (bijv. 404 Not Found)
        if (!response.ok) {
            throw new Error('Netwerkfout bij het laden van GeoJSON: ' + response.statusText);
        }
        return response.json(); // Converteer de respons naar een JavaScript-object
    })
    .then(network_data_full_final => {
        // --- Alle GeoJSON verwerkingslogica komt hierbinnen te staan ---

        // Functie om de styling van de punten (Nodes) te bepalen
        function styleNodes(feature) {
            const type = feature.properties.type;
            let color = '#3388ff'; 
            let radius = 6;
            
            if (type === 'Person') {
                color = '#E91E63'; 
                radius = 4;
            } else if (type === 'Country') {
                color = '#4CAF50'; 
                radius = 8;
            }
            return {
                radius: radius,
                fillColor: color,
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.7
            };
        }

        // Functie om de styling van de lijnen (Edges) te bepalen
        function styleEdges(feature) {
            const relationship = feature.properties.relationship;
            let color = '#555555';
            let weight = 1;

            if (relationship === 'In Land') {
                color = '#FF9800'; 
                weight = 2;
            }
            return {
                color: color,
                weight: weight,
                opacity: 0.8
            };
        }

        // Functie om popups toe te voegen wanneer op een feature wordt geklikt
        function onEachFeature(feature, layer) {
            let popupContent = "";

            if (feature.geometry.type === 'Point') {
                popupContent = `
                    <b>Knooppunt:</b> ${feature.properties.label}<br>
                    <b>ID:</b> ${feature.properties.id}<br>
                    <b>Type:</b> ${feature.properties.type}
                `;
            } else if (feature.geometry.type === 'LineString') {
                popupContent = `
                    <b>Relatie:</b> ${feature.properties.relationship}<br>
                    Van: ${feature.properties.source_label ? feature.properties.source_label : feature.properties.source_id}<br>
                    Naar: ${feature.properties.target_label ? feature.properties.target_label : feature.properties.target_id}
                `;
            }
            
            layer.bindPopup(popupContent);
        }

        // Voeg de GeoJSON-data toe aan de kaart
        const geoJsonLayer = L.geoJSON(network_data_full_final, {
            // Styling voor punten (Nodes)
            pointToLayer: function (feature, latlng) {
                if (feature.geometry.type === 'Point') {
                    return L.circleMarker(latlng, styleNodes(feature));
                }
                return null;
            },
            // Styling en popups voor alle features
            style: function(feature) {
                 if (feature.geometry.type === 'LineString') {
                    return styleEdges(feature);
                 }
                 return {}; 
            },
            onEachFeature: onEachFeature
        }).addTo(map);

        // Pas de kaart aan om alle data in beeld te brengen
        // Dit zorgt ervoor dat u niet handmatig hoeft in te zoomen
        if (network_data_full_final.features.length > 0) {
            map.fitBounds(geoJsonLayer.getBounds(), {padding: [50, 50]});
        }
    })
    .catch(error => {
        console.error('Er is een fout opgetreden bij het verwerken van de GeoJSON data:', error);
        // Geeft een waarschuwing in de browser als de data niet geladen kon worden
        alert('Fout bij het laden van de data. Controleer de bestandsnaam en de console (F12) voor details.');
    });
